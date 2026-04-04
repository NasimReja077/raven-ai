// src/controllers/graph.controller.js
import { SaveItem } from "../models/SaveItem.models.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/graph
export const getGraph = asyncHandler(async (req, res) => {
  // Fetch all non-archived saves with tags + cluster populated
  const saves = await SaveItem.find({
    user: req.user._id,
    isArchived: false,
  })
    .populate("tags", "name color")
    .select(
      "title url thumbnail siteName type tags favicon clusterId clusterLabel hasEmbedding embedding"
    )
    .lean();

  if (!saves.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, { nodes: [], links: [] }, "Graph data"));
  }

  // ── Build nodes — one per save 
  const nodes = saves.map((save) => ({
    id: save._id.toString(),
    title: save.title || save.url,
    url: save.url,
    thumbnail: save.thumbnail,
    favicon: save.favicon,
    siteName: save.siteName,
    type: save.type,
    clusterId: save.clusterId || null,
    clusterLabel: save.clusterLabel || null,
    tags: save.tags.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      color: t.color,
    })),
  }));

  // ── Build links 
  // Three link types with different strengths:
  //   1. shared-tag  — share ≥ 1 tag          (weight = sharedTags count)
  //   2. same-cluster — same clusterId          (weight = 0.6)
  //   3. embedding   — cosine sim ≥ 0.80       (weight = similarity score)

  const links = [];
  const seen = new Set();

  const addLink = (sourceId, targetId, type, weight, meta = {}) => {
    const key = [sourceId, targetId].sort().join("||");
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ source: sourceId, target: targetId, type, weight, ...meta });
  };

  // 1. Tag-based links
  for (let i = 0; i < saves.length; i++) {
    for (let j = i + 1; j < saves.length; j++) {
      const tagsA = saves[i].tags.map((t) => t._id.toString());
      const tagsB = saves[j].tags.map((t) => t._id.toString());
      const shared = tagsA.filter((t) => tagsB.includes(t));
      if (shared.length > 0) {
        addLink(
          saves[i]._id.toString(),
          saves[j]._id.toString(),
          "shared-tag",
          Math.min(1.0, shared.length * 0.33),
          { sharedTags: shared.length }
        );
      }
    }
  }

  // 2. Cluster-based links
  const clusterGroups = {};
  for (const save of saves) {
    if (!save.clusterId) continue;
    if (!clusterGroups[save.clusterId]) clusterGroups[save.clusterId] = [];
    clusterGroups[save.clusterId].push(save._id.toString());
  }
  for (const members of Object.values(clusterGroups)) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        addLink(members[i], members[j], "same-cluster", 0.6);
      }
    }
  }

  // 3. Embedding similarity links (cosine ≥ 0.80, only if embeddings loaded)
  const embeddedSaves = saves.filter(
    (s) => s.hasEmbedding && Array.isArray(s.embedding) && s.embedding.length > 0
  );

  if (embeddedSaves.length > 1) {
    const cosineSim = (a, b) => {
      let dot = 0, mA = 0, mB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        mA += a[i] * a[i];
        mB += b[i] * b[i];
      }
      const d = Math.sqrt(mA) * Math.sqrt(mB);
      return d === 0 ? 0 : dot / d;
    };

    for (let i = 0; i < embeddedSaves.length; i++) {
      for (let j = i + 1; j < embeddedSaves.length; j++) {
        const a = embeddedSaves[i];
        const b = embeddedSaves[j];
        if (a.embedding.length !== b.embedding.length) continue;
        const sim = cosineSim(a.embedding, b.embedding);
        if (sim >= 0.80) {
          addLink(
            a._id.toString(),
            b._id.toString(),
            "embedding",
            parseFloat(sim.toFixed(3)),
            { similarity: parseFloat(sim.toFixed(3)) }
          );
        }
      }
    }
  }

  // Strip embeddings from nodes response (they're large and already used above)
  const cleanNodes = nodes.map(({ embedding: _, ...rest }) => rest);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          nodes: cleanNodes,
          links,
          stats: {
            totalNodes: cleanNodes.length,
            totalLinks: links.length,
            tagLinks: links.filter((l) => l.type === "shared-tag").length,
            clusterLinks: links.filter((l) => l.type === "same-cluster").length,
            embeddingLinks: links.filter((l) => l.type === "embedding").length,
          },
        },
        "Graph data fetched"
      )
    );
});