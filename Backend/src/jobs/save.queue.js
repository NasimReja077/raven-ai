// src/jobs/save.queue.js
import { Queue } from "bullmq";

let _saveQueue = null;

export const getSaveQueue = () => {
  if (!_saveQueue) {
    if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not set in .env");

    _saveQueue = new Queue("save-processing", {
      connection: { url: process.env.REDIS_URL },
      defaultJobOptions: {
        attempts: 3, // retry up to 3 times
        backoff: { 
          type: "exponential", 
          delay: 3000 // 3 s → 9 s → 27 s
        },
        removeOnComplete: { count: 100 },// keep last 100 completed jobs
        removeOnFail: { count: 200 },// keep last 200 failed jobs for inspection
      },
    });

    _saveQueue.on("error", (err) => console.error("❌ Save queue error:", err.message),
    );
    console.log("✅ Save processing queue ready");
  }
  return _saveQueue;
};

// Add fresh-save job
export const addSaveJob = async ({ saveId, userId }) => {
  const queue = getSaveQueue();
  return queue.add(
    "process-save",
    { 
      saveId: saveId.toString(), 
      userId: userId.toString() 
    },
    {
      // ✅ FIX: BullMQ v5 forbids ":" in custom jobIds — use "-" instead
      jobId: `save-${saveId}`,
    },
  );
};

// Add reprocess job
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
      // ✅ FIX: was `reprocess:${saveId}:${Date.now()}` — colons forbidden
      // Use timestamp suffix so multiple reprocess calls are allowed
      jobId: `reprocess-${saveId}-${Date.now()}`,
      priority: 5, // lower priority than fresh saves
    },
  );
};

// Bulk enqueue
export const addBulkSaveJobs = async (items) => {
  const queue = getSaveQueue();
  return queue.addBulk(
    items.map(({ saveId, userId }) => ({
      name: "process-save",
      data: { saveId: saveId.toString(), userId: userId.toString() },
      opts: { jobId: `save-${saveId}` },
    })),
  );
};

// Queue health stats
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