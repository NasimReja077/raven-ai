// src/services/aiProcessor.service.js
//

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
//   generateFlashcards,
} from "./ai.service.js";

import { generateAITags } from "./aiTag.service.js";
import { processAndStoreEmbedding }from "./embedding.service.js";


// Main pipeline

/**
 * processAIForSaveItem(itemId)
 *
 * Runs the full AI enrichment pipeline for one SaveItem.
 * Safe to call from BullMQ worker — catches errors, updates processingStatus.
 *
 * @param   {string}  itemId  MongoDB ObjectId string
 * @returns {object}  The updated SaveItem document
 */


export const processAIForSaveItem = async (itemId, opts = {} ) => {
  const item = await SaveItem.findById(itemId);
  if (!item) throw new Error(`SaveItem not found: ${itemId}`);

  console.log(`Starting AI processing for item: ${itemId}`);

  try {
    // Build the text context we'll pass to all AI calls
    const context = {
      title: item.title || "",
      description: item.description || "",
      content: item.description || "", // content field from scraper stored in description
      summary: item.summary  || "",
      type: item.type || "link",
    };

    // ── Step 1: Summary + shortNote + keyPoints
    // Only generate if not already present (allows partial re-processing)

    if (!item.summary || item.summary.length < 30) {
      const summaryResult = await generateSummary(context);
      item.summary   = summaryResult.summary;
      item.shortNote = summaryResult.shortNote;
      item.keyPoints = summaryResult.keyPoints;

      // Update context with fresh summary for downstream steps
      context.summary = item.summary;
    }

    // ── Step 2: Topics + keywords + difficulty 
    if (!item.topics || item.topics.length === 0) {
      const tkResult = await generateTopicsAndKeywords(context);
      item.topics = tkResult.topics;
      item.keywords = tkResult.keywords;
      item.difficulty = tkResult.difficulty;
    }

    // ── Step 3: Follow-up questions
    // ✅ Store in keyPoints extension (or add a `questions` field to model if desired)
    // For now we log — add a `questions: [String]` field to SaveItem.model.js to persist
    const questions = await generateQuestions({
      title:   item.title,
      summary: item.summary,
    });
    // If you add a questions field: item.questions = questions;
    // We attach it as a transient property so the worker can use it without a schema change
    item.questions = questions;

    // ── Step 4: AI Tags 
    const { tagNames, tagIds } = await generateAITags(item);

    // Merge AI tag IDs with any user-added tag IDs already on the item
    const existingTagIds = item.tags.map((t) => t.toString());
    const newTagIds = tagIds.map((t) => t.toString());
    const mergedTagIds   = [...new Set([...existingTagIds, ...newTagIds])];
    item.tags = mergedTagIds;

    console.log(`Generated ${tagNames.length} AI tags: ${tagNames.join(", ")}`);

    // ── Step 5: Persist all AI fields 
    item.processingStatus = "completed";
    item.processedAt = new Date();

    await item.save();
    console.log(`✅ AI processing completed for item ${itemId}`);

    // ── Step 6: Trigger embedding (non-blocking, has its own error handling) ─
    if (!opts.skipEmbedding) {
      processAndStoreEmbedding(itemId).catch((err) => {
        console.error(`⚠️  Embedding failed for ${itemId}:`, err.message);
        // AI success is already persisted; embedding can be retried via reEmbedItem()
      });
    }

    return item;
  } catch (error) {
    console.error(`❌ AI Processing failed for ${itemId}:`, error.message);

    // Mark failed in DB so the worker knows not to retry infinitely
    await SaveItem.updateOne(
      { _id: itemId },
      {
        $set: {
          processingStatus: "failed",
          processingError:  error.message,
        },
      }
    );

    throw error; // re-throw so BullMQ registers the job as failed + retries
  }
};


// Partial re-processing  (user edited note/highlights → regenerate)

/**
 * reprocessSummary(itemId)
 * Re-generates summary + shortNote + keyPoints only.
 * Lighter than full reprocessing — called when user adds highlights/notes.
 */
export const reprocessSummary = async (itemId) => {
  const item = await SaveItem.findById(itemId);
  if (!item) throw new Error(`SaveItem not found: ${itemId}`);

  const summaryResult = await generateSummary({
    title: item.title,
    description: item.description,
    content: item.description,
    type: item.type,
  });

  await SaveItem.updateOne(
    { _id: itemId },
    {
      $set: {
        summary: summaryResult.summary,
        shortNote: summaryResult.shortNote,
        keyPoints: summaryResult.keyPoints,
      },
    }
  );

  return summaryResult;
};

/**
 * reprocessFull(itemId)
 * Forces a full re-run of every AI step, ignoring cached values.
 */
export const reprocessFull = async (itemId) => {
  // Reset fields so pipeline re-runs all steps
  await SaveItem.updateOne(
    { _id: itemId },
    {
      $set: {
        summary: "",
        shortNote: "",
        keyPoints: [],
        topics: [],
        keywords: [],
        questions: [],
        processingStatus: "pending",
        processingError:  null,
      },
    }
  );
  return processAIForSaveItem(itemId);
};
