// src/services/aiProcessor.service.js

// Pipeline:
//   1. Summary + shortNote + keyPoints
//   2. Topics + keywords + difficulty
//   3. Follow-up questions
//   4. AI tag generation + MongoDB upsert
//   5. Save all AI fields to SaveItem
//   6. Trigger embedding pipeline (non-blocking)
import { SaveItem } from "../models/SaveItem.models.js";
import {
  generateSummary,
  generateTopicsAndKeywords,
  generateQuestions,
} from "./ai.service.js";
import { generateAITags } from "./aiTag.service.js";
import { processAndStoreEmbedding } from "./embedding.service.js";
// Main pipeline

export const processAIForSaveItem = async (itemId, opts = {}) => {
  const item = await SaveItem.findById(itemId);
  if (!item) throw new Error(`SaveItem not found: ${itemId}`);
  console.log(`🤖 Starting AI processing for item: ${itemId}`);

  try {
    // Build the text context pass to all AI calls
    const context = {
      title: item.title || "",
      description: item.description || "",
      content: item.description || "", // content field from scraper stored in description
      summary: item.summary || "",
      type: item.type || "link",
    };
    
    // Step 1: Summary + shortNote + keyPoints
    // Only generate if not already present (allows partial re-processing)

    if (!item.summary || item.summary.length < 30) {
      const r = await generateSummary(context); // r =summaryResult
      item.summary = r.summary;
      item.shortNote = r.shortNote;
      item.keyPoints = r.keyPoints;
      // Update context with fresh summary for downstream steps
      context.summary = item.summary;
    }

    // Step 2: Topics + keywords + difficulty 

    if (!item.topics || item.topics.length === 0) {
      const tk = await generateTopicsAndKeywords(context);
      item.topics = tk.topics;
      item.keywords = tk.keywords;
      item.difficulty = tk.difficulty;
    }

    // Step 3: Follow-up questions
    const questions = await generateQuestions({
      title: item.title,
      summary: item.summary,
    });
    if (item.schema?.path("questions")) item.questions = questions;

    // Step 4: AI Tags — merge with existing user-added tags
    const { tagNames, tagIds } = await generateAITags(item);
    item.tags = [
      ...new Set([
        ...item.tags.map((t) => t.toString()),
        ...tagIds.map((t) => t.toString()),
      ]),
    ];
    console.log(`🏷️  AI tags: ${tagNames.join(", ")}`);

    // Step 5: Persist all AI fields

    item.processingStatus = "completed";
    item.processedAt = new Date();
    await item.save();
    console.log(`✅ AI processing done for item ${itemId}`);

    // Step 6: Trigger embedding (non-blocking, has its own error handling)
    if (!opts.skipEmbedding) {
      processAndStoreEmbedding(itemId).catch((err) =>
        console.error(`⚠️ Embedding failed for ${itemId}:`, err.message),
      );
    }
    return item;
  } catch (error) {
    console.error(`❌ AI Processing failed for ${itemId}:`, error.message);

    // Mark failed in DB so the worker knows not to retry infinitely

    await SaveItem.updateOne(
      { _id: itemId },
      { $set: 
        { 
          processingStatus: "failed", 
          processingError: error.message 
        } 
      },
    );
    throw error;
  }
};

// Partial re-processing  (user edited note/highlights → regenerate)

export const reprocessSummary = async (itemId) => {
  const item = await SaveItem.findById(itemId);
  if (!item) throw new Error(`SaveItem not found: ${itemId}`);
  const r = await generateSummary({
    title: item.title,
    description: item.description,
    content: item.description,
    type: item.type,
  });
  await SaveItem.updateOne(
    { _id: itemId },
    {
      $set: {
        summary: r.summary,
        shortNote: r.shortNote,
        keyPoints: r.keyPoints,
      },
    },
  );
  return r;
};

// reprocessFull(itemId) - Forces a full re-run of every AI step, ignoring cached values.
export const reprocessFull = async (itemId) => {
  await SaveItem.updateOne(
    { _id: itemId },
    {
      $set: {
        summary: "",
        shortNote: "",
        keyPoints: [],
        topics: [],
        keywords: [],
        processingStatus: "pending",
        processingError: null,
      },
    },
  );
  return processAIForSaveItem(itemId);
};
