// src/services/embedding.service.js
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { generateEmbeddingsBatch, generateEmbedding } from "./ai.service.js";
import { getPineconeIndex } from "../config/pinecone.config.js";
import { SaveItem } from "../models/SaveItem.models.js";
export { generateEmbedding as embedText };

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
  separators: ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
});

const PINECONE_BATCH_SIZE = 100;

export const chunkText = async (text) => {
  if (!text || !text.trim()) return [];
  const chunks = await splitter.splitText(text.trim());
  return chunks.map((c) => c.trim()).filter((c) => c.length > 20);
};

// ─── Mean-pool a list of equal-length vectors
const meanPool = (vectors) => {
  if (!vectors.length) return null;
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) sum[i] += v[i];
  }
  return sum.map((x) => x / vectors.length);
};

/**
 * processAndStoreEmbedding(itemId)
 *
 * Full embedding pipeline:
 *   1. Fetch item from MongoDB
 *   2. Build fullText (title + description + summary + highlights + keyPoints)
 *   3. Chunk with RecursiveCharacterTextSplitter
 *   4. Batch-embed all chunks via Mistral
 *   5. Upsert vectors to Pinecone (for RAG search)
 *   6. Compute mean-pool embedding → save to SaveItem.embedding (for local cosine similarity)
 */
export const processAndStoreEmbedding = async (itemId) => {
  const item = await SaveItem.findById(itemId).lean();
  if (!item) throw new Error(`SaveItem not found: ${itemId}`);

  // Build rich text blob
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
    fullText +=
      "\n\nHighlights:\n" + item.highlights.map((h) => h.text).join("\n");

  if (item.keyPoints?.length > 0)
    fullText += "\n\nKey Points:\n" + item.keyPoints.join("\n");

  if (!fullText.trim()) {
    console.warn(`⚠️ No embeddable text for item ${itemId}`);
    await SaveItem.updateOne(
      { _id: itemId },
      {
        $set: {
          hasEmbedding: false,
          processingStatus: "failed",
          processingError: "No embeddable text",
        },
      }
    );
    return [];
  }

  // Chunk
  const chunks = await chunkText(fullText);
  if (chunks.length === 0) {
    console.warn(`⚠️ Text splitter produced 0 chunks for item ${itemId}`);
    return [];
  }
  console.log(`📄 ${chunks.length} chunks for item ${itemId}`);

  // Batch embed
  const embeddings = await generateEmbeddingsBatch(chunks);

  // Build Pinecone vectors
  const vectors = [];
  const vectorIds = [];
  const validEmbeddings = []; // only the embeddings paired with a valid chunk

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
    validEmbeddings.push(embeddings[i]);
  }

  if (vectors.length === 0) {
    console.warn(`⚠️ No valid vectors built for item ${itemId}`);
    return [];
  }

  // Upsert to Pinecone in batches
  const pineconeIndex = await getPineconeIndex();
  let upsertedCount = 0;
  for (let i = 0; i < vectors.length; i += PINECONE_BATCH_SIZE) {
    const batch = vectors.slice(i, i + PINECONE_BATCH_SIZE);
    await pineconeIndex.upsert(batch);
    upsertedCount += batch.length;
    console.log(
      `📌 Pinecone upsert: ${upsertedCount}/${vectors.length} vectors for item ${itemId}`
    );
  }

  // ── FIX: Compute mean-pool embedding for local cosine similarity 

  const meanEmbedding = meanPool(validEmbeddings);

  // Update MongoDB
  await SaveItem.updateOne(
    { _id: itemId },
    {
      $set: {
        embeddingId: vectorIds[0] || null,
        hasEmbedding: vectorIds.length > 0,
        embeddingVersion: (item.embeddingVersion || 0) + 1,
        processedAt: new Date(),
        // NEW: persist mean embedding so graph + clustering work locally
        ...(meanEmbedding ? { embedding: meanEmbedding } : {}),
      },
    }
  );

  console.log(`✅ Stored ${vectors.length} Pinecone vectors + mean embedding for item ${itemId}`);
  return vectorIds;
};

// Delete embeddings from Pinecone + clear MongoDB fields
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
    console.log(`🗑 Deleted Pinecone vectors for item ${itemId}`);
  } catch {
    // Fallback for starter plans that don't support filter-delete
    try {
      const index = await getPineconeIndex();
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

export const reEmbedItem = async (itemId) => {
  const item = await SaveItem.findById(itemId);
  if (!item) throw new Error(`Item not found: ${itemId}`);
  await SaveItem.updateOne(
    { _id: itemId },
    { $set: { processingStatus: "processing", hasEmbedding: false } }
  );
  await deleteEmbeddings(itemId, item.user.toString());
  return processAndStoreEmbedding(itemId);
};

export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length)
    throw new Error("Vectors must exist and have equal dimensions");
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const d = Math.sqrt(magA) * Math.sqrt(magB);
  return d === 0 ? 0 : dot / d;
};