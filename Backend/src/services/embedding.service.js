// src/services/embedding.service.js
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"; 
import { generateEmbeddingsBatch, generateEmbedding } from "./ai.service.js";
import { getPineconeIndex } from "../config/pinecone.config.js";
import { SaveItem } from "../models/SaveItem.models.js";  


const splitter = new RecursiveCharacterTextSplitter({
  chunkSize:    800,
  chunkOverlap: 150,
  separators:   ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
});

const PINECONE_BATCH_SIZE = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Re-export embedText from ai.service so callers only need one import
// ─────────────────────────────────────────────────────────────────────────────
export { generateEmbedding as embedText };

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
  if (!text || text.trim().length === 0) return [];
  const chunks = await splitter.splitText(text.trim());
  return chunks.map((c) => c.trim()).filter((c) => c.length > 20);
};

// Process SaveItem → Chunk → Embed → Upsert to Pinecone
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

  // Build rich text
  let fullText = [item.title, item.description, item.summary, item.shortNote, item.userNote]
    .filter(Boolean)
    .join("\n\n");

  if (item.headings?.length > 0) {
    fullText += "\n\nHeadings:\n" + item.headings.map((h) => `H${h.level}: ${h.text}`).join("\n");
  }
  if (item.highlights?.length > 0) {
    fullText += "\n\nHighlights:\n" + item.highlights.map((h) => h.text).join("\n");
  }
  if (item.keyPoints?.length > 0) {
    fullText += "\n\nKey Points:\n" + item.keyPoints.join("\n");
  }

  if (!fullText.trim()) {
    console.warn(`⚠️ No embeddable text for item: ${itemId}`);
    await SaveItem.updateOne({ _id: itemId }, {
      $set: { hasEmbedding: false, processingStatus: "failed", processingError: "No embeddable text" },
    });
    return [];
  }

  // Chunk
  const chunks = await chunkText(fullText);
  if (chunks.length === 0) {
    console.warn(`⚠️ Splitter produced 0 chunks for item: ${itemId}`);
    return [];
  }

  // Batch embed via ai.service
  const embeddings = await generateEmbeddingsBatch(chunks);

  // Build Pinecone vectors
  const vectors   = [];
  const vectorIds = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    if (!embeddings[i] || chunk.length < 40) continue;

    const vectorId = `${item.user.toString()}_${item._id.toString()}_${i}`;

    vectors.push({
      id:     vectorId,
      values: embeddings[i],
      metadata: {
        userId: item.user.toString(),
        itemId: item._id.toString(),
        chunkIndex: i,
        text: chunk.slice(0, 500),
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

  // Upsert to Pinecone (batched)

  if (vectors.length > 0) {
    const pineconeIndex = await getPineconeIndex();
    for (let i = 0; i < vectors.length; i += PINECONE_BATCH_SIZE) {
      await pineconeIndex.upsert(vectors.slice(i, i + PINECONE_BATCH_SIZE));
    }
    console.log(`✅ Stored ${vectors.length} vectors for item ${itemId}`);
  }

  // Update MongoDB

  await SaveItem.updateOne({ _id: itemId }, {
    $set: {
      embeddingId:      vectorIds[0]           || null,
      hasEmbedding:     vectorIds.length > 0,
      embeddingVersion: (item.embeddingVersion || 0) + 1,
      processedAt:      new Date(),
    },
  });

  return vectorIds;
};

// Delete embeddings

export const deleteEmbeddings = async (itemId, userId) => {
  if (!itemId || !userId) return;
  try {
    const pineconeIndex = await getPineconeIndex();
    await pineconeIndex.deleteMany({
      filter: { itemId: { $eq: itemId.toString() }, userId: { $eq: userId.toString() } },
    });
    console.log(`🗑️ Deleted embeddings for item ${itemId}`);
  } catch {
    // Free plan fallback: ID-based delete
    try {
      const pineconeIndex = await getPineconeIndex();
      const ids = Array.from({ length: 200 }, (_, i) => `${userId}_${itemId}_${i}`);
      await pineconeIndex.deleteMany(ids);
    } catch (err) {
      console.error(`Fallback delete failed for ${itemId}:`, err.message);
    }
  }
};

// Re-embed item
export const reEmbedItem = async (itemId) => {
  const item = await SaveItem.findById(itemId);
  if (!item) throw new Error(`Item not found: ${itemId}`);

  await SaveItem.updateOne({ _id: itemId }, {
    $set: { processingStatus: "processing", hasEmbedding: false },
  });

  await deleteEmbeddings(itemId, item.user.toString());
  return await processAndStoreEmbedding(itemId);
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Cosine similarity (local)
// ─────────────────────────────────────────────────────────────────────────────
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) {
    throw new Error("cosineSimilarity: vectors must exist and have equal dimensions");
  }
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
};