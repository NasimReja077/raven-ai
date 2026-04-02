// src/workers/processItem.worker.js
//
// BullMQ worker that handles all background processing for saved items.
//
// Job types: 
// "process-save" - fresh save: scrape → AI → embed
// "reprocess-save" - re-run AI (and optionally scraping) on an existing item
//
// Concurrency: 3 jobs in parallel 
// Retry: 3 attempts with exponential backoff (configured on the queue)

import { Worker } from "bullmq";
import { SaveItem } from "../models/SaveItem.models.js";
import { scrapeContent } from "../services/scraper.service.js";
import { processAIForSaveItem, reprocessFull, reprocessSummary } from "../services/aiProcessor.service.js";
import { reEmbedItem } from "../services/embedding.service.js";
import { QUEUE_NAME } from "../jobs/save.queue.js";


// Job handlers

/**
 * handleProcessSave(job)
 *
 * Full pipeline for a freshly saved URL:
 *   1. Mark as "processing"
 *   2. Scrape URL → enrich SaveItem fields
 *   3. Run AI pipeline (summary, tags, topics, questions, embedding)
 */
const handleProcessSave = async (job) => {
     const { saveId } = job.data;

     // Mark processing 
     const item = await SaveItem.findById(saveId);
     if (!item) {
          // Item was deleted before the job ran — skip silently
          console.warn(`⚠️  SaveItem ${saveId} not found — skipping job`);
          return { skipped: true };
     }

     await SaveItem.findByIdAndUpdate(saveId, {
          $set: { 
               processingStatus: "processing", 
               processingError: null 
          },
     });

     await job.updateProgress(5);
     console.log(` [${job.id}] Processing save: ${saveId}`);

     // Scrape
     // Only scrape if we don't already have content (allows manual saves to skip)
     let scrapedData = null;
     if (item.url && (!item.description || item.description.length < 100)) {
          try {
               console.log(` [${job.id}] Scraping: ${item.url}`);
               scrapedData = await scrapeContent(item.url);

               // Persist scraped fields immediately so partial data is never lost
               await SaveItem.findByIdAndUpdate(saveId, {
                    $set: {
                         title: scrapedData.title || item.title,
                         description: scrapedData.content || scrapedData.description || "",
                         thumbnail: scrapedData.thumbnail || "",
                         siteName: scrapedData.siteName || "",
                         favicon: scrapedData.favicon || "",
                         "sourceMeta.author": scrapedData.author || "",
                         "sourceMeta.wordCount": scrapedData.wordCount || 0,
                         "sourceMeta.platform": scrapedData.platform || "website",
                         "sourceMeta.readTime": Math.ceil((scrapedData.wordCount || 0) / 200),
                         ...(scrapedData.videoId && { "sourceMeta.videoId": scrapedData.videoId }),
                         ...(scrapedData.pages && { "sourceMeta.pages": scrapedData.pages }),
                    },
               });
          } catch (scrapeErr) {
               // Non-fatal: log and continue with whatever data we have
               console.error(`⚠️  [${job.id}] Scrape failed for ${item.url}:`, scrapeErr.message);
               await SaveItem.findByIdAndUpdate(saveId, {
                    $set: { "sourceMeta.platform": item.type || "website" },
               });
          }
     }

     await job.updateProgress(35);

     // AI processing 
     // processAIForSaveItem re-fetches the item so it picks up the scraped fields
     await processAIForSaveItem(saveId);

     await job.updateProgress(100);
     console.log(`✅ [${job.id}] Completed: ${saveId}`);

     return { success: true, saveId };
};

/**
 * handleReprocessSave(job)
 *
 * Re-runs AI processing on an existing item.
 * Used when: user adds highlights/notes, manual re-trigger, version upgrade.
 *
 * job.data.full = true  → reset all AI fields and redo everything
 * job.data.full = false → redo only summary + embedding
 */
const handleReprocessSave = async (job) => {
     const { saveId, full } = job.data;

     const item = await SaveItem.findById(saveId);
     if (!item) {
          console.warn(`⚠️  SaveItem ${saveId} not found — skipping reprocess`);
          return { skipped: true };
     }

     await job.updateProgress(10);
     console.log(` [${job.id}] Reprocessing (full=${full}): ${saveId}`);

     if (full) {
          await reprocessFull(saveId);
     } else {
          // Light reprocess: summary + re-embed only
          await reprocessSummary(saveId);
          await reEmbedItem(saveId);
     }

     await job.updateProgress(100);
     console.log(`✅ [${job.id}] Reprocess done: ${saveId}`);

     return { success: true, saveId, full };
};

// Router — dispatches by job name

const jobRouter = async (job) => {
     switch (job.name) {
          case "process-save": return handleProcessSave(job);
          case "reprocess-save": return handleReprocessSave(job);
          default:
               throw new Error(`Unknown job name: "${job.name}"`);
     }
};

// Worker factory

let _worker = null;

/**
 * startWorker()
 * Starts the BullMQ worker. Call once at app startup.
 * Returns the worker instance (useful for graceful shutdown in tests).
 */
export const startWorker = () => {
     if (_worker) return _worker; // idempotent

     if (!process.env.REDIS_URL) {
          throw new Error("REDIS_URL is not set — cannot start worker");
     }

     _worker = new Worker(QUEUE_NAME, jobRouter, {
          connection: { 
               url: process.env.REDIS_URL 
          },
          concurrency: 3,  // 3 parallel jobs — safe for Mistral rate limits
          limiter: { max: 10, duration: 60_000 }, // max 10 jobs/min per worker
     });

     // ── Event listeners ────────────────────────────────────────────────────────
     _worker.on("active", (job) => {
          console.log(`▶️  Job active  [${job.id}] ${job.name} — saveId: ${job.data.saveId}`);
     });

     _worker.on("completed", (job, result) => {
          if (result?.skipped) {
               console.log(`⏭️  Job skipped [${job.id}] — item no longer exists`);
          } else {
               console.log(`✅ Job done    [${job.id}] ${job.name}`);
          }
     });

     _worker.on("failed", (job, err) => {
          console.error(
               `❌ Job failed  [${job?.id}] ${job?.name} (attempt ${job?.attemptsMade}/${job?.opts?.attempts}):`,
               err.message
          );

          // On final failure, make sure the DB reflects the error
          if (job?.data?.saveId && job?.attemptsMade >= (job?.opts?.attempts ?? 3)) {
               SaveItem.findByIdAndUpdate(job.data.saveId, {
                    $set: {
                         processingStatus: "failed",
                         processingError: err.message,
                    },
               }).catch(() => { }); // fire-and-forget
          }
     });

     _worker.on("progress", (job, progress) => {
          console.log(`📊 Job progress [${job.id}]: ${progress}%`);
     });

     _worker.on("error", (err) => {
          console.error("❌ Worker error:", err.message);
     });

     // ── Graceful shutdown ──────────────────────────────────────────────────────
     const shutdown = async (signal) => {
          console.log(`\n${signal} received — closing worker gracefully…`);
          await _worker.close();
          console.log("✅ Worker closed");
          process.exit(0);
     };

     process.once("SIGTERM", () => shutdown("SIGTERM"));
     process.once("SIGINT", () => shutdown("SIGINT"));

     console.log("✅ processItem worker started (concurrency: 3)");
     return _worker;
};

/**
 * stopWorker()
 * Gracefully drain and close the worker — used in tests / shutdown hooks.
 */
export const stopWorker = async () => {
     if (_worker) {
          await _worker.close();
          _worker = null;
     }
};