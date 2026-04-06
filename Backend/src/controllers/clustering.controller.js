// src/controllers/clustering.controller.js

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { SaveItem } from "../models/SaveItem.models.js";
import { clusterUserItems, getSimilarItems, getClusterStats } from "../services/clustering.service.js";
import { runDBSCAN, suggestDBSCANParams } from "../services/dbscan.service.js";

// POST /api/clusters/run
export const runClustering = asyncHandler(async (req, res) => {
  const { k = 6, dryRun = false } = req.body ?? {};   // ← FIX
  if (k < 2 || k > 20) throw new ApiError(400, "k must be between 2 and 20");

  const result = await clusterUserItems(req.user._id, {
    k: Number(k),
    labelClusters: true,
    dryRun: Boolean(dryRun),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      dryRun
        ? `Dry-run: found ${result.clusters.length} clusters`
        : `K-Means complete — ${result.clusters.length} clusters across ${result.totalItems} items`
    )
  );
});

// POST /api/clusters/dbscan
export const runDBSCANClustering = asyncHandler(async (req, res) => {
  const { epsilon = 0.25, minPts = 2, dryRun = false } = req.body ?? {};  // ← FIX

  if (epsilon <= 0 || epsilon >= 1)
    throw new ApiError(400, "epsilon must be between 0 and 1 (cosine distance)");
  if (minPts < 1 || minPts > 20)
    throw new ApiError(400, "minPts must be between 1 and 20");

  const result = await runDBSCAN(req.user._id, {
    epsilon: Number(epsilon),
    minPts:  Number(minPts),
    labelClusters: true,
    dryRun: Boolean(dryRun),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      `DBSCAN complete — ${result.totalClusters} clusters, ${result.totalNoise} noise points`
    )
  );
});

// GET /api/clusters/dbscan/suggest
export const suggestParams = asyncHandler(async (req, res) => {
  const result = await suggestDBSCANParams(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, result, "DBSCAN parameter suggestions")
  );
});

// GET /api/clusters
export const getClusters = asyncHandler(async (req, res) => {
  const stats = await getClusterStats(req.user._id);
  return res.status(200).json(new ApiResponse(200, stats, "Clusters fetched"));
});

// GET /api/clusters/:clusterId/saves
export const getClusterSaves = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [saves, total] = await Promise.all([
    SaveItem.find({ user: req.user._id, clusterId: req.params.clusterId, isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("tags", "name color")
      .populate("collections", "name icon"),
    SaveItem.countDocuments({ user: req.user._id, clusterId: req.params.clusterId, isArchived: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      saves,
      pagination: {
        total, page: Number(page), limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: skip + saves.length < total,
      },
    }, "Cluster saves fetched")
  );
});

// GET /api/saves/:id/similar
export const getSimilarItemsHandler = asyncHandler(async (req, res) => {
  const { limit = 6, threshold = 0.72 } = req.query;

  const results = await getSimilarItems(req.params.id, req.user._id, {
    limit:     Number(limit),
    threshold: Number(threshold),
  });

  return res.status(200).json(new ApiResponse(200, results, "Similar items fetched"));
});