// src/services/dbscan.service.js
//
// DBSCAN clustering on SaveItem embeddings using the `density-clustering` package.
// Unlike K-Means (k-clusters.service.js), DBSCAN:
//   - Does NOT require specifying k in advance
//   - Handles arbitrary cluster shapes
//   - Marks noise/outlier points explicitly
//   - Struggles with varying-density clusters (K-Means++ handles those better)
//
// Use DBSCAN when: number of clusters is unknown, outliers exist, clusters are non-spherical.
// Use K-Means when: you know roughly how many topics you have.

import DBSCAN from "density-clustering";
import { SaveItem } from "../models/SaveItem.models.js";
import { generateClusterLabel } from "./ai.service.js";

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_EPSILON = 0.25;  // cosine distance threshold (1 - cosineSim)
const DEFAULT_MIN_PTS = 2;     // minimum neighbors to form a dense region
const MIN_ITEMS = 4;     // need at least this many embedded items

// ─────────────────────────────────────────────────────────────────────────────
// Cosine distance (1 - similarity) — DBSCAN needs a DISTANCE, not similarity
// ─────────────────────────────────────────────────────────────────────────────
const cosineDistance = (a, b) => {
     if (!a || !b || a.length !== b.length) return 1; // max distance on error
     let dot = 0, mA = 0, mB = 0;
     for (let i = 0; i < a.length; i++) {
          dot += a[i] * b[i];
          mA += a[i] * a[i];
          mB += b[i] * b[i];
     }
     const denom = Math.sqrt(mA) * Math.sqrt(mB);
     return denom === 0 ? 1 : 1 - dot / denom;
};

// ─────────────────────────────────────────────────────────────────────────────
// runDBSCAN(userId, options)
//
// Options:
//   epsilon   {number}  cosine-distance threshold (default: 0.25)
//               → 0.25 ≈ cosine similarity ≥ 0.75  (very similar)
//               → 0.40 ≈ cosine similarity ≥ 0.60  (loosely related)
//   minPts    {number}  min neighbors to form cluster core (default: 2)
//   labelClusters {bool} call AI to name clusters (default: true)
//   dryRun    {bool}    skip MongoDB persist (default: false)
//
// Returns: { clusters, noise, totalItems, params }
// ─────────────────────────────────────────────────────────────────────────────
export const runDBSCAN = async (userId, options = {}) => {
     const {
          epsilon = DEFAULT_EPSILON,
          minPts = DEFAULT_MIN_PTS,
          labelClusters = true,
          dryRun = false,
     } = options;

     // 1. Fetch embedded items
     const items = await SaveItem.find({
          user: userId,
          hasEmbedding: true,
          isArchived: false,
     })
          .select("+embedding title type tags clusterId")
          .lean();

     if (items.length < MIN_ITEMS) {
          return {
               clusters: [],
               noise: [],
               totalItems: items.length,
               params: { epsilon, minPts },
               message: `Need at least ${MIN_ITEMS} embedded items. Have ${items.length}.`,
          };
     }

     const validItems = items.filter(
          (item) => Array.isArray(item.embedding) && item.embedding.length > 0
     );

     if (validItems.length < MIN_ITEMS) {
          return { clusters: [], noise: [], totalItems: validItems.length, params: { epsilon, minPts } };
     }

     // 2. Build distance matrix for density-clustering
     //    The library accepts: dataset (array of points) + distance function + epsilon + minPts
     const dataset = validItems.map((item) => item.embedding);

     const dbscan = new DBSCAN();
     // dbscan.run(dataset, epsilon, minPts, distanceFunction)
     // Returns array of clusters, each cluster is array of point indices
     const rawClusters = dbscan.run(dataset, epsilon, minPts, cosineDistance);
     const noiseIndices = dbscan.noise; // indices of noise points

     // 3. Map indices back to SaveItems
     const clusters = rawClusters.map((clusterIndices, ci) => {
          const clusterItems = clusterIndices.map((idx) => validItems[idx]);
          return {
               clusterId: `dbscan_${userId.toString().slice(-6)}_${ci}`,
               items: clusterItems,
               label: null,
               description: "",
          };
     });

     const noiseItems = noiseIndices.map((idx) => validItems[idx]);

     // 4. Generate AI labels (parallel)
     if (labelClusters && clusters.length > 0) {
          await Promise.all(
               clusters.map(async (cluster) => {
                    try {
                         const titles = cluster.items.map((i) => i.title).filter(Boolean);
                         const { label, description } = await generateClusterLabel(titles);
                         cluster.label = label;
                         cluster.description = description;
                    } catch {
                         cluster.label = `Cluster ${clusters.indexOf(cluster) + 1}`;
                    }
               })
          );
     }

     // 5. Persist to MongoDB (bulk write)
     if (!dryRun) {
          const bulkOps = [];

          // Update clustered items
          for (const cluster of clusters) {
               for (const item of cluster.items) {
                    bulkOps.push({
                         updateOne: {
                              filter: { _id: item._id },
                              update: { $set: { clusterId: cluster.clusterId, clusterLabel: cluster.label || null } },
                         },
                    });
               }
          }

          // Clear cluster info from noise items
          for (const item of noiseItems) {
               bulkOps.push({
                    updateOne: {
                         filter: { _id: item._id },
                         update: { $set: { clusterId: null, clusterLabel: null } },
                    },
               });
          }

          if (bulkOps.length > 0) {
               await SaveItem.bulkWrite(bulkOps, { ordered: false });
          }
     }

     // 6. Return response (strip raw embeddings)
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
          noise: noiseItems.map((i) => ({
               _id: i._id,
               title: i.title,
               type: i.type,
          })),
          totalItems: validItems.length,
          totalClusters: clusters.length,
          totalNoise: noiseItems.length,
          params: { epsilon, minPts },
     };
};

// ─────────────────────────────────────────────────────────────────────────────
// suggestDBSCANParams(userId)
//
// Analyses pairwise distances to suggest good epsilon value.
// Uses the "k-distance graph" heuristic: sort distances to k-th nearest neighbor.
// The "elbow" in that graph is a good epsilon.
// ─────────────────────────────────────────────────────────────────────────────
export const suggestDBSCANParams = async (userId) => {
     const items = await SaveItem.find({
          user: userId,
          hasEmbedding: true,
          isArchived: false,
     })
          .select("+embedding")
          .lean();

     const valid = items.filter(
          (i) => Array.isArray(i.embedding) && i.embedding.length > 0
     );

     if (valid.length < 4) {
          return { suggestedEpsilon: DEFAULT_EPSILON, suggestedMinPts: DEFAULT_MIN_PTS };
     }

     const K = Math.max(2, Math.floor(Math.log(valid.length))); // heuristic: minPts ≈ ln(n)

     // For each point, find distance to its K-th nearest neighbor
     const kDistances = valid.map((point, i) => {
          const distances = valid
               .map((other, j) => (i === j ? Infinity : cosineDistance(point.embedding, other.embedding)))
               .sort((a, b) => a - b);
          return distances[K - 1]; // K-th nearest
     });

     kDistances.sort((a, b) => a - b);

     
     // Find elbow: largest jump in sorted distances
     let maxJump = 0;
     let elbowIdx = Math.floor(kDistances.length * 0.9); // default: 90th percentile
     for (let i = 1; i < kDistances.length; i++) {
          const jump = kDistances[i] - kDistances[i - 1];
          if (jump > maxJump) {
               maxJump = jump;
               elbowIdx = i;
          }
     }

     const suggestedEpsilon = parseFloat((kDistances[elbowIdx] || DEFAULT_EPSILON).toFixed(3));

     return {
          suggestedEpsilon: Math.min(suggestedEpsilon, 0.5), // cap at 0.5
          suggestedMinPts: K,
          kDistanceSample: kDistances.slice(0, 20).map((d) => parseFloat(d.toFixed(4))),
          itemCount: valid.length,
     };
};