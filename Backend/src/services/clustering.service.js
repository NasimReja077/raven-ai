// src/services/clustering.service.js
//
// Clusters a user's SaveItems by their stored embeddings using K-Means.
// Also provides "find similar items" via cosine similarity — used by the
// getSimilarItems controller endpoint.
//
// Pipeline:
//   1. Fetch all items that have embeddings
//   2. Run K-Means (Hartigan-Wong style, pure JS — no native deps)
//   3. Optionally generate a cluster label via AI
//   4. Persist clusterId + clusterLabel back to MongoDB

import { SaveItem } from "../models/SaveItem.models.js";
import { cosineSimilarity } from "./embedding.service.js";
import { generateClusterLabel } from "./ai.service.js";

// ─── Hyper-parameters 
const DEFAULT_K         = 6;   // default number of clusters
const MAX_ITERATIONS    = 50;  // K-Means convergence limit
const CONVERGENCE_DELTA = 1e-6; // stop when centroid movement < this
const MIN_ITEMS_FOR_CLUSTER = 5; // need at least this many items to cluster

// Utility: Euclidean distance between two equal-length vectors

const euclidean = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};


// Utility: Mean of an array of equal-length vectors

const meanVector = (vectors) => {
  if (!vectors.length) return null;
  const dim = vectors[0].length;
  const result = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) result[i] += v[i];
  }
  return result.map((x) => x / vectors.length);
};


// K-Means++ initialisation — smarter seed selection, fewer empty clusters

const kMeansPlusPlus = (points, k) => {
  const centroids = [];

  // Pick first centroid uniformly at random
  centroids.push(points[Math.floor(Math.random() * points.length)]);

  for (let c = 1; c < k; c++) {
    // For each point, compute squared distance to nearest centroid
    const dists = points.map((p) => {
      const minD = Math.min(...centroids.map((c) => euclidean(p, c)));
      return minD * minD;
    });

    // Weighted random pick
    const total = dists.reduce((s, d) => s + d, 0);
    let r = Math.random() * total;
    for (let i = 0; i < points.length; i++) {
      r -= dists[i];
      if (r <= 0) {
        centroids.push(points[i]);
        break;
      }
    }
    // Fallback if floating-point issues leave r > 0
    if (centroids.length < c + 1) centroids.push(points[points.length - 1]);
  }

  return centroids;
};


// Core K-Means
// Returns: { assignments: number[], centroids: number[][] }

const kMeans = (points, k) => {
  // Guard: if fewer points than k, reduce k
  const actualK = Math.min(k, points.length);

  let centroids = kMeansPlusPlus(points, actualK);
  let assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Assignment step
    const newAssignments = points.map((p) => {
      let minDist = Infinity;
      let best = 0;
      for (let ci = 0; ci < centroids.length; ci++) {
        const d = euclidean(p, centroids[ci]);
        if (d < minDist) {
          minDist = d;
          best = ci;
        }
      }
      return best;
    });

    // Check convergence
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;
    if (!changed) break;

    // Update step — recompute centroids
    let moved = 0;
    for (let ci = 0; ci < actualK; ci++) {
      const members = points.filter((_, i) => assignments[i] === ci);
      if (members.length === 0) continue; // empty cluster — keep old centroid
      const newCentroid = meanVector(members);
      moved = Math.max(moved, euclidean(centroids[ci], newCentroid));
      centroids[ci] = newCentroid;
    }

    if (moved < CONVERGENCE_DELTA) break;
  }

  return { assignments, centroids };
};


// clusterUserItems(userId, options)
//
// Main public function — clusters all embedded items for one user.
//
// Options:
//   k           {number}  number of clusters (default: DEFAULT_K)
//   labelClusters {bool}  call AI to generate cluster labels (default: true)
//   dryRun      {bool}    don't persist — just return results (default: false)
//
// Returns: { clusters: ClusterResult[], totalItems: number, k: number }

export const clusterUserItems = async (userId, options = {}) => {
  const {
    k = DEFAULT_K,
    labelClusters = true,
    dryRun = false,
  } = options;

  // 1. Fetch items with embeddings
  const items = await SaveItem.find({
    user: userId,
    hasEmbedding: true,
    isArchived: false,
  })
    .select("+embedding title type tags clusterId")
    .lean();

  if (items.length < MIN_ITEMS_FOR_CLUSTER) {
    return {
      clusters: [],
      totalItems: items.length,
      k: 0,
      message: `Need at least ${MIN_ITEMS_FOR_CLUSTER} embedded items to cluster. Currently have ${items.length}.`,
    };
  }

  // 2. Extract valid embeddings
  const validItems = items.filter(
    (item) => Array.isArray(item.embedding) && item.embedding.length > 0
  );

  if (validItems.length < MIN_ITEMS_FOR_CLUSTER) {
    return { clusters: [], totalItems: validItems.length, k: 0 };
  }

  const points = validItems.map((item) => item.embedding);

  // 3. Run K-Means
  const effectiveK = Math.min(k, Math.floor(validItems.length / 2));
  const { assignments, centroids } = kMeans(points, effectiveK);

  // 4. Group items by cluster
  const clusterMap = {};
  for (let ci = 0; ci < effectiveK; ci++) {
    clusterMap[ci] = {
      clusterId: `cluster_${userId.toString().slice(-6)}_${ci}`,
      items: [],
      centroid: centroids[ci],
    };
  }

  assignments.forEach((clusterIdx, itemIdx) => {
    if (clusterMap[clusterIdx]) {
      clusterMap[clusterIdx].items.push(validItems[itemIdx]);
    }
  });

  // Remove empty clusters
  const clusters = Object.values(clusterMap).filter((c) => c.items.length > 0);

  // 5. Generate AI labels (parallel, non-blocking per cluster)
  if (labelClusters) {
    await Promise.all(
      clusters.map(async (cluster) => {
        try {
          const titles = cluster.items.map((i) => i.title).filter(Boolean);
          const { label, description } = await generateClusterLabel(titles);
          cluster.label = label;
          cluster.description = description;
        } catch {
          cluster.label = `Cluster ${clusters.indexOf(cluster) + 1}`;
          cluster.description = "";
        }
      })
    );
  }

  // 6. Persist to MongoDB (unless dry run)
  if (!dryRun) {
    const bulkOps = clusters.flatMap((cluster) =>
      cluster.items.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              clusterId: cluster.clusterId,
              clusterLabel: cluster.label || null,
            },
          },
        },
      }))
    );

    if (bulkOps.length > 0) {
      await SaveItem.bulkWrite(bulkOps, { ordered: false });
    }
  }

  // 7. Return results (strip raw embeddings from response)
  return {
    clusters: clusters.map((c) => ({
      clusterId: c.clusterId,
      label: c.label || null,
      description: c.description || "",
      itemCount: c.items.length,
      items: c.items.map((i) => ({
        _id: i._id,
        title: i.title,
        type: i.type,
        tags: i.tags,
      })),
    })),
    totalItems: validItems.length,
    k: clusters.length,
  };
};


// getSimilarItems(itemId, userId, options)
//
// Finds items most similar to a given item using cosine similarity on stored
// embeddings — faster than Pinecone for small-to-medium vaults.
//
// Options:
//   limit     {number}  max results (default: 6)
//   threshold {number}  min cosine score (default: 0.72)
//   candidates {number} how many items to score (default: 120)

export const getSimilarItems = async (itemId, userId, options = {}) => {
  const {
    limit     = 6,
    threshold = 0.72,
    candidates = 120,
  } = options;

  // Fetch the target item's embedding
  const target = await SaveItem.findOne({ _id: itemId, user: userId })
    .select("+embedding title type")
    .lean();

  if (!target) throw new Error("Save not found");
  if (!target.embedding?.length) return [];

  // Fetch candidate pool (most recent, excluding self)
  const pool = await SaveItem.find({
    user: userId,
    _id: { $ne: itemId },
    isArchived: false,
    hasEmbedding: true,
  })
    .select("+embedding title url thumbnail type siteName favicon tags createdAt")
    .populate("tags", "name color")
    .sort({ createdAt: -1 })
    .limit(candidates)
    .lean();

  // Score and filter
  const results = pool
    .filter((item) => item.embedding?.length === target.embedding.length)
    .map((item) => ({
      _id:        item._id,
      title:      item.title,
      url:        item.url,
      thumbnail:  item.thumbnail,
      type:       item.type,
      siteName:   item.siteName,
      favicon:    item.favicon,
      tags:       item.tags,
      createdAt:  item.createdAt,
      score:      cosineSimilarity(target.embedding, item.embedding),
    }))
    .filter((item) => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
};


// getClusterStats(userId)
// Returns a summary of cluster distribution for the dashboard.

export const getClusterStats = async (userId) => {
  const stats = await SaveItem.aggregate([
    { $match: { user: userId, isArchived: false, clusterId: { $ne: null } } },
    {
      $group: {
        _id: "$clusterId",
        label: { $first: "$clusterLabel" },
        count: { $sum: 1 },
        types: { $addToSet: "$type" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return stats.map((s) => ({
    clusterId:  s._id,
    label:      s.label || s._id,
    itemCount:  s.count,
    types:      s.types,
  }));
};