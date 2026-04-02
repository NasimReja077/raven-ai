// src/jobs/save.queue.js
import { Queue } from "bullmq";

// ─── Lazy singleton
let _saveQueue = null; 

/**
 * Returns the shared BullMQ Queue instance.
 * Lazily instantiated on first call so the app can boot before Redis is ready.
 */
export const getSaveQueue = () => {
     if (!_saveQueue) {
          if (!process.env.REDIS_URL) {
               throw new Error("REDIS_URL is not set in .env");
          }

          _saveQueue = new Queue("save-processing", {
               connection: { url: process.env.REDIS_URL },
               defaultJobOptions: {
                    attempts: 3, // retry up to 3 times
                    backoff: {
                         type: "exponential", delay: 3000 // 3 s → 9 s → 27 s
                    }, 
                    removeOnComplete: { count: 100 }, // keep last 100 completed jobs
                    removeOnFail: { count: 200 }, // keep last 200 failed jobs for inspection
               },
          });

          _saveQueue.on("error", (err) => {
               console.error("❌ Save queue error:", err.message);
          });

          console.log("✅ Save processing queue ready");
     }
     return _saveQueue;
};


// Job adders

/**
 * addSaveJob({ saveId, userId })
 *
 * Enqueues one SaveItem for scraping + AI enrichment.
 * Uses a deterministic jobId so the same item is never queued twice.
 */
export const addSaveJob = async ({ saveId, userId }) => {
     const queue = getSaveQueue();
     return queue.add(
          "process-save",
          {
               saveId: saveId.toString(),
               userId: userId.toString(),
          },
          {
               jobId: `save:${saveId}`,
          }
     );
};

/**
 * addReprocessJob({ saveId, userId, full })
 *
 * Enqueues a re-processing job (AI-only, no scraping).
 * full = true  → wipe all AI fields and redo everything
 * full = false → only redo summary + embedding
 */
export const addReprocessJob = async ({ saveId, userId, full = false }) => {
     const queue = getSaveQueue();
     return queue.add(
          "reprocess-save",
          {
               saveId: saveId.toString(),
               userId: userId.toString(),
               full,
          },
          {
               jobId: `reprocess:${saveId}:${Date.now()}`, // unique — allow multiple reprocess calls
               priority: 5, // lower priority than fresh saves
          }
     );
};

/**
 * addBulkSaveJobs(items[])
 * Batch-enqueue multiple items efficiently (BullMQ bulk API).
 */
export const addBulkSaveJobs = async (items) => {
     const queue = getSaveQueue();
     const jobs = items.map(({ saveId, userId }) => ({
          name: "process-save",
          data: { saveId: saveId.toString(), userId: userId.toString() },
          opts: { jobId: `save:${saveId}` },
     }));
     return queue.addBulk(jobs);
};

/**
 * getQueueStats()
 * Returns queue health metrics — useful for an admin dashboard endpoint.
 */
export const getQueueStats = async () => {
     const queue = getSaveQueue();
     const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
     ]);
     return { waiting, active, completed, failed, delayed };
};

export const QUEUE_NAME = "save-processing";