// src/services/embedding.service.js
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { generateEmbeddingsBatch, generateEmbedding } from "./ai.service.js";
import { getPineconeIndex } from "../config/pinecone.config.js";
import { SaveItem } from "../models/SaveItem.models.js";
// Re-export embedText from ai.service so callers only need one import
export { generateEmbedding as embedText };

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
  separators: ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
});

const PINECONE_BATCH_SIZE = 100;

// export const  embedText = async (texts) => {
//   if (!texts || texts.length === 0) return [];  const validTexts = texts
//     .map((t) => t?.trim())
//     .filter((t) => t && t.length >= 20);  if (validTexts.length === 0) return [];
//   const results = [];  for (let i = 0; i < validTexts.length; i += EMBED_BATCH_SIZE) {
//     const batch = validTexts
//       .slice(i, i + EMBED_BATCH_SIZE)
//       .map((t) => t.slice(0, 8000)); 
      
//       response = await mistral.embeddings.create({
//       model: "mistral-embed",
//       inputs: batch,
//   }); 
//   results.push(...response.data.map((item) => item.embedding));
// } 
// return results;


// Chunk text
export const chunkText = async (text) => {
  if (!text || !text.trim()) return [];
  const chunks = await splitter.splitText(text.trim());
  return chunks
  .map((c) => c.trim())
  .filter((c) => c.length > 20);
};

// processAndStoreEmbedding(itemId)
// Full pipeline: SaveItem → chunk → embed → Pinecone upsert → MongoDB update
/**
 * processAndStoreEmbedding(itemId)
 *
 * Full embedding pipeline for one SaveItem:
 *   1. Fetch item from MongoDB
 *   2. Build rich fullText (title + description + summary + highlights + keyPoints)
 *   3. Chunk with RecursiveCharacterTextSplitter
 *   4. Batch-embed all chunks via ai.service.generateEmbeddingsBatch
 *   5. Upsert vectors to Pinecone
 *   6. Update SaveItem: embeddingId, hasEmbedding, embeddingVersion
 */

export const processAndStoreEmbedding = async (itemId) => {
  const item = await SaveItem.findById(itemId).lean();
  if (!item) throw new Error(`SaveItem not found: ${itemId}`);

  // Build rich text blob from all text fields

  let fullText = [
    item.title,
    item.description,
    item.summary,
    item.shortNote,
    item.userNote,
  ]
  .filter(Boolean)
  .join("\n\n");

  if (item.highlights?.length > 0)
    fullText += "\n\nHighlights:\n" + item.highlights.map((h) => h.text).join("\n");
 
  if (item.keyPoints?.length > 0)
    fullText += "\n\nKey Points:\n" + item.keyPoints.join("\n");

  if (!fullText.trim()) {
    console.warn(`⚠️ No embeddable text for item ${itemId}`);
    await SaveItem.updateOne(
      { _id: itemId },
      {
        $set: {
          hasEmbedding:   false,
          processingStatus: "failed",
          processingError: "No embeddable text",
        },
      }
    );
    return [];
  }

  // Chunk
  const chunks = await chunkText(fullText);

  // if (!chunks.length === 0) return [];
  // ✅ FIX: was `!chunks.length === 0` which is ALWAYS false (boolean !== 0)
  //    Correct check: `chunks.length === 0`
  if (chunks.length === 0) {
    console.warn(`⚠️ Text splitter produced 0 chunks for item ${itemId}`);
    return [];
  }

  console.log(` ${chunks.length} chunks for item ${itemId}`);

  // Batch embed via Mistral
  const embeddings = await generateEmbeddingsBatch(chunks);

  // Build Pinecone vectors
  const vectors = [];
  const vectorIds = [];

  for (let i = 0; i < chunks.length; i++) {
    if (!embeddings[i] || chunks[i].length < 40) continue;

    const vectorId = `${item.user.toString()}_${item._id.toString()}_${i}`;

    vectors.push({
      id: vectorId,
      values: embeddings[i],
      metadata: {
        userId: item.user.toString(),
        itemId: item._id.toString(),
        chunkIndex: i,
        text: chunks[i].slice(0, 500),
        type: item.type || "link",
        title: (item.title || "Untitled").slice(0, 150),
        platform: item.sourceMeta?.platform || "website",
        createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
        clusterId: item.clusterId || "",
        isArchived: Boolean(item.isArchived),
        isFavorite: Boolean(item.isFavorite),
        difficulty: item.difficulty || "intermediate",
      },
    });
    vectorIds.push(vectorId);
  }


  if (vectors.length === 0) {
    console.warn(`No valid vectors built for item ${itemId}`);
    return [];
  }

  // Upsert to Pinecone in batches
  const pineconeIndex = await getPineconeIndex();
 
  let upsertedCount = 0;
  for (let i = 0; i < vectors.length; i += PINECONE_BATCH_SIZE) {
    const batch = vectors.slice(i, i + PINECONE_BATCH_SIZE);
    await pineconeIndex.upsert(batch);
    upsertedCount += batch.length;
    console.log(`Pinecone upsert: ${upsertedCount}/${vectors.length} vectors for item ${itemId}`);
  }


  // Upsert to Pinecone (batched)

  // if (vectors.length > 0) {
  //   const index = await getPineconeIndex();
  //   for (let i = 0; i < vectors.length; i += 100)
  //     await index.upsert(vectors.slice(i, i + 100));
  //   console.log(`✅ Stored ${vectors.length} vectors for ${itemId}`);
  // }


// Update MongoDB

  await SaveItem.updateOne(
    { _id: itemId },
    {
      $set: {
        embeddingId: vectorIds[0] || null,
        hasEmbedding: vectorIds.length > 0,
        embeddingVersion: (item.embeddingVersion || 0) + 1,
        processedAt: new Date(),
      },
    },
  );

  console.log(`✅ Stored ${vectors.length} Pinecone vectors for item ${itemId}`);
  return vectorIds;
};


// Delete embeddings

export const deleteEmbeddings = async (itemId, userId) => {
  if (!itemId || !userId) return;
  try {
    const index = await getPineconeIndex();
    await index.deleteMany({
      filter: {
        itemId: { $eq: itemId.toString() },
        userId: { $eq: userId.toString() },
      },
    });
    console.log(`Deleted Pinecone vectors for item ${itemId}`);
  } catch {
    // Fallback for free/starter plans that don't support filter-delete
    try {
      const index = await getPineconeIndex();
      // Try deleting by guessed IDs (up to 200 chunks per item)
      const ids = Array.from(
        { length: 200 },
        (_, i) => `${userId}_${itemId}_${i}`
      );
      await index.deleteMany(ids);
    } catch (err) {
      console.error(`Fallback delete failed for ${itemId}:`, err.message);
    }
  }
};

// Re-embed item
export const reEmbedItem = async (itemId) => {
  const item = await SaveItem.findById(itemId);
  if (!item) throw new Error(`Item not found: ${itemId}`);

  await SaveItem.updateOne(
    { _id: itemId },
    { 
      $set: {
          processingStatus: "processing",
          hasEmbedding: false 
        } 
    },
  );
  await deleteEmbeddings(itemId, item.user.toString());
  return processAndStoreEmbedding(itemId);
};

// 5. Cosine similarity (local)
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length)
    throw new Error("Vectors must exist and have equal dimensions");
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const d = Math.sqrt(magA) * Math.sqrt(magB);
  return d === 0 ? 0 : dot / d;
};
