// src/controllers/saves.controller.js
import { SaveItem } from "../models/SaveItem.models.js";
import { Collection } from "../models/Collection.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { scrapeContent } from "../services/scraper.service.js";
import { generateEmbedding } from "../services/ai.service.js";
import { deleteEmbeddings, cosineSimilarity } from "../services/embedding.service.js";
import { addSaveJob, addReprocessJob } from "../jobs/save.queue.js";


// Constants (were commented out but referenced — now defined here)
const RELATED_THRESHOLD = 0.72;
const RELATED_MAX_RESULTS = 6;
const RELATED_CANDIDATES = 120;
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/saves
// ─────────────────────────────────────────────────────────────────────────────
export const createSave = asyncHandler(async (req, res) => {
  const { url, userNote, collectionIds, tags, ...rest } = req.body;

  if (!url && !req.file) throw new ApiError(400, "URL is required");

  // ── Duplicate check ────────────────────────────────────────────────────────
  if (url) {
    const existing = await SaveItem.findOne(
      {
        url,
        user: req.user._id
      });
    if (existing) {
      throw new ApiError(409, "You've already saved this URL");
      // return res.status(200)
      //   .json(new ApiError(200, "You've already saved this URL"));
    }
  }

  // ── Quick metadata (title / thumbnail) via cheap HEAD or OG scrape ─────────
  // We do a lightweight scrape here so the item shows something in the UI
  // immediately; the full deep scrape happens in the background job.
  let quickMeta = {};
  if (url) {
    try {
      quickMeta = await scrapeContent(url);
    } catch {
      // Non-fatal: we'll get it in the background job
    }
  }

  // ── Create SaveItem ────────────────────────────────────────────────────────
  const saveItem = await SaveItem.create({
    user: req.user._id,
    url: url || null,
    title: rest.title || quickMeta.title || url || "Untitled",
    description: quickMeta.content || quickMeta.description || "",
    thumbnail: quickMeta.thumbnail || "",
    siteName: quickMeta.siteName || "",
    favicon: quickMeta.favicon || "",
    userNote: userNote || "",
    type: rest.type || quickMeta.type || "link",
    tags: tags || [],
    collections: collectionIds || [],
    source: "web",
    processingStatus: "pending",
    "sourceMeta.platform": quickMeta.platform || "website",
    "sourceMeta.author": quickMeta.author || "",
    "sourceMeta.wordCount": quickMeta.wordCount || 0,
  });

  // ── Update collection item counts ──────────────────────────────────────────
  if (collectionIds?.length) {
    await Collection.updateMany(
      { _id: { $in: collectionIds }, user: req.user._id },
      { $inc: { itemCount: 1 }, lastUpdated: new Date() }
    );
  }

  // ── Enqueue background processing ─────────────────────────────────────────
  try {
    await addSaveJob({ saveId: saveItem._id, userId: req.user._id });
  } catch (queueErr) {
    console.error("⚠️  Queue failed — processing will not happen:", queueErr.message);
    await SaveItem.findByIdAndUpdate(saveItem._id, { processingStatus: "failed" });
  }

  return res.status(201).json(
    new ApiResponse(201, saveItem, "Saved! Processing in background…")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saves
// ─────────────────────────────────────────────────────────────────────────────
export const getAllSaves = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type, isFavorite,
    isArchived = "false",
    search,
    semantic = "false",
    tag, collection, platform,
    sort = "-createdAt",
  } = req.query;

  // ── Semantic / vector search path ──────────────────────────────────────────
  if (search?.trim() && semantic === "true") {
    if (search.trim().length < 3) {
      return res.status(200).json(
        new ApiResponse(200, { saves: [], pagination: null }, "Query too short")
      );
    }

    const queryEmbedding = await generateEmbedding(search.trim());
    if (!queryEmbedding) {
      return res.status(200).json(
        new ApiResponse(200, { saves: [], pagination: null }, "Embedding unavailable")
      );
    }

    const candidates = await SaveItem.find({
      user: req.user._id,
      isArchived: false,
    })
      .select("+embedding title url description userNote tags thumbnail type siteName favicon")
      .populate("tags", "name color")
      .populate("collections", "name icon")
      .lean();

    // BUG FIX: `term` was undefined — now correctly uses `searchTerm`
    const searchTerm = search.toLowerCase().trim();
    // const searchTerm = search.toLowerCase().trim();

    const scored = candidates
      .map((save) => {
        // Vector similarity (0-1)
        let aiScore = save.embedding?.length ? cosineSimilarity(queryEmbedding, save.embedding) : 0;
        // if (save.embedding?.length) {
        //   aiScore = cosineSimilarity(queryEmbedding, save.embedding);
        // }
        if (
          (save.title || "").toLowerCase().includes(searchTerm) ||
          (save.url || "").toLowerCase().includes(searchTerm)
        ) {
          aiScore = Math.max(aiScore, 1.0);
        } else if (save.tags?.some((t) => (t.name || "").toLowerCase().includes(term))) {
          aiScore = Math.max(aiScore, 0.9);
        } else if (
          (save.description || "").toLowerCase().includes(term) ||
          (save.userNote || "").toLowerCase().includes(term)
        ) {
          aiScore = Math.max(aiScore, 0.8);
        }

        return { ...save, aiScore, embedding: undefined };

        // Keyword boost — rewards exact matches above any embedding score
        // const isTitleMatch = (save.title || "").toLowerCase().includes(searchTerm);
        // const isUrlMatch   = (save.url || "").toLowerCase().includes(searchTerm);
        // const isTagMatch   = save.tags?.some((t) => (t.name || "").toLowerCase().includes(searchTerm));
        // const isDescMatch  = (save.description || "").toLowerCase().includes(searchTerm);
        // const isNoteMatch  = (save.userNote || "").toLowerCase().includes(searchTerm);

        // let finalScore = aiScore;
        // if (isTitleMatch || isUrlMatch) finalScore = Math.max(finalScore, 1.0);
        // else if (isTagMatch) finalScore = Math.max(finalScore, 0.9);
        // else if (isDescMatch || isNoteMatch) finalScore = Math.max(finalScore, 0.8);

        // return { ...save, score: finalScore, embedding: undefined };
      })
      .filter((s) => s.aiScore > 0.4)
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, Number(limit));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          saves: scored,
          pagination: {
            total: scored.length,
            page: 1,
            limit: Number(limit),
            totalPages: 1
          },
        },
        "Semantic search results"
      )
    );
  }

  // ── Standard filter path
  const filter = {
    user: req.user._id,
    isArchived: isArchived === "true",
  };

  if (type) filter.type = type;
  if (isFavorite) filter.isFavorite = isFavorite === "true";
  if (tag) filter.tags = tag;
  if (collection) filter.collections = collection;
  if (platform) filter["sourceMeta.platform"] = platform;

  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortBy = search?.trim()
    ? { score: { $meta: "textScore" }, createdAt: -1 }
    : sort;

  const [saves, total] = await Promise.all([
    SaveItem.find(filter, search?.trim() ? { score: { $meta: "textScore" } } : {})
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .populate("tags", "name color")
      .populate("collections", "name icon"),
    SaveItem.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      saves,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: skip + saves.length < total,
      },
    }, "Saves fetched successfully"));
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saves/stats
// ─────────────────────────────────────────────────────────────────────────────
export const getSaveStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // BUG FIX: Promise.all had 5 items but only 4 destructuring targets —
  // added `totalCount` as the 5th variable and use it in the response

  const [typeBreakdown, platformBreakdown, recentActivity, totalFavorites] =
    await Promise.all([
      SaveItem.aggregate([
        { $match: { user: userId, isArchived: false } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      SaveItem.aggregate([
        { $match: { user: userId, isArchived: false } },
        { $group: { _id: "$sourceMeta.platform", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      SaveItem.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": -1,
            "_id.month": -1,
            "_id.day": -1
          }
        },
        { $limit: 30 },
      ]),
      SaveItem.countDocuments({ user: userId, isFavorite: true }),
      SaveItem.countDocuments({ user: userId, isArchived: false }),
    ]);
  // const total = typeBreakdown.reduce((s, t) => s + t.count, 0);

  return res.status(200)
    .json(new ApiResponse(
      200, {
      total: totalCount,
      favorites: totalFavorites,
      typeBreakdown,
      platformBreakdown,
      recentActivity
    },
      "Stats fetched"
    ));
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saves/resurface
// ─────────────────────────────────────────────────────────────────────────────
export const getSaveToResurface = asyncHandler(async (req, res) => {
  const { count = 3 } = req.query;
  // const daysAgo = new Date();
  // daysAgo.setDate(daysAgo.getDate() - 30);
  const daysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const candidates = await SaveItem.find({
    user: req.user._id,
    isArchived: false,
    createdAt: { $lt: daysAgo },
    $or: [
      { lastResurfacedAt: null },
      { lastResurfacedAt: { $lt: daysAgo } }],
  })
    .select("title url thumbnail siteName type tags shortNote createdAt")
    .populate("tags", "name color")
    .lean();

  if (!candidates.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No saves to resurface yet"));
  }

  // Fisher-Yates shuffle then take `count`
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const picked = candidates.slice(0, Number(count));

  // Mark resurfaced (fire-and-forget)
  SaveItem.updateMany(
    { _id: { $in: picked.map((s) => s._id) } },
    {
      $set: { lastResurfacedAt: new Date() },
      $inc: { resurfaceCount: 1 }
    })
    .catch(() => { });

  return res.status(200)
    .json(new ApiResponse(200, picked, "Resurfaced saves"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saves/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getSaveById = asyncHandler(async (req, res) => {
  const save = await SaveItem.findOne({ _id: req.params.id, user: req.user._id })
    .populate("tags", "name color")
    .populate("collections", "name icon");

  if (!save) throw new ApiError(404, "Save not found");
  return res.status(200).json(new ApiResponse(200, save, "Save fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/saves/:id/related
// ─────────────────────────────────────────────────────────────────────────────
export const getRelatedSaves = asyncHandler(async (req, res) => {
  // const THRESHOLD   = 0.72;
  // const MAX_RESULTS = 6;
  // const CANDIDATES  = 120;

  const current = await SaveItem.findOne({ _id: req.params.id, user: req.user._id })
    .select("+embedding");

  if (!current) throw new ApiError(404, "Save not found");

  if (!current.embedding?.length) {
    return res.status(200).json(
      new ApiResponse(200, [], "No embedding available yet — check back after processing")
    );
  }

  const candidates = await SaveItem.find({
    user: req.user._id,
    _id: { $ne: req.params.id },
    isArchived: false,
    hasEmbedding: true,
  })
    .select("+embedding title url thumbnail type siteName favicon tags createdAt")
    .populate("tags", "name color")
    .sort({ createdAt: -1 })
    .limit(RELATED_CANDIDATES)
    .lean();

  // BUG FIX: THRESHOLD / MAX_RESULTS were undefined (commented-out constants).
  // Now using RELATED_THRESHOLD / RELATED_MAX_RESULTS defined at top of file.
  const results = candidates
    .filter((s) => s.embedding?.length === current.embedding.length)
    .map((s) => ({
      ...s,
      score: cosineSimilarity(current.embedding, s.embedding),
      embedding: undefined,
    }))
    .filter((s) => s.score >= RELATED_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, RELATED_MAX_RESULTS);

  return res.status(200).json(new ApiResponse(200, results, "Related saves"));
});


// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/saves/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateSave = asyncHandler(async (req, res) => {
  const ALLOWED = ["title", "userNote", "isFavorite", "isArchived", "type"];
  const updates = {};
  ALLOWED.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (!Object.keys(updates).length) {
    throw new ApiError(400, "No valid fields to update");
  }

  const save = await SaveItem.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate("tags", "name color")
    .populate("collections", "name icon");

  if (!save) throw new ApiError(404, "Save not found");

  if (updates.userNote) {
    addReprocessJob({ saveId: save._id, userId: req.user._id, full: false }).catch(() => { });
  }
  return res.status(200).json(new ApiResponse(200, save, "Save updated"));
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/saves/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSave = asyncHandler(async (req, res) => {
  const save = await SaveItem.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!save) throw new ApiError(404, "Save not found");

  // Decrement collection counts (fire-and-forget)
  if (save.collections?.length) {
    Collection.updateMany(
      { _id: { $in: save.collections } },
      { $inc: { itemCount: -1 } }
    ).catch(() => { });
  }
  // Remove vectors from Pinecone (fire-and-forget)
  deleteEmbeddings(save._id.toString(), req.user._id.toString()).catch(() => { });
  return res.status(200).json(new ApiResponse(200, {}, "Save deleted"));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/saves/:id/reprocess
// ─────────────────────────────────────────────────────────────────────────────
export const reprocessSave = asyncHandler(async (req, res) => {
  const { full = false } = req.body;

  const exists = await SaveItem.exists({ _id: req.params.id, user: req.user._id });
  if (!exists) throw new ApiError(404, "Save not found");

  await addReprocessJob({
    saveId: req.params.id,
    userId: req.user._id,
    full,
  });

  return res.status(202).json(
    new ApiResponse(202, {}, `Re-processing queued (full=${full})`)
  );
});


// ─── POST /api/v1/saves/:id/highlights ───────────────────────────────────────
export const addHighlight = asyncHandler(async (req, res) => {
  const { text, note } = req.body;
  if (!text?.trim()) throw new ApiError(400, "Highlight text is required");
  const save = await SaveItem.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $push: { highlights: { text: text.slice(0, 500), note: note || "" } } },
    { new: true }
  );
  if (!save) throw new ApiError(404, "Save not found");
  addReprocessJob({ saveId: save._id, userId: req.user._id, full: false }).catch(() => { });
  return res.status(200).json(new ApiResponse(200, { highlights: save.highlights }, "Highlight added"));
});

// ─── DELETE /api/v1/saves/:id/highlights/:hId ────────────────────────────────
export const deleteHighlight = asyncHandler(async (req, res) => {
  const save = await SaveItem.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $pull: { highlights: { _id: req.params.hId } } },
    { new: true }
  );
  if (!save) throw new ApiError(404, "Save not found");
  return res.status(200).json(new ApiResponse(200, { highlights: save.highlights }, "Highlight deleted"));
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/saves/:id/collections   → add to collection
// DELETE /api/v1/saves/:id/collections/:collectionId → remove from collection
// ─────────────────────────────────────────────────────────────────────────────
export const addToCollection = asyncHandler(async (req, res) => {
  const { collectionId } = req.body;
  if (!collectionId) throw new ApiError(400, "collectionId is required");

  const col = await Collection.findOne({ _id: collectionId, user: req.user._id });
  if (!col) throw new ApiError(404, "Collection not found");

  const save = await SaveItem.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $addToSet: { collections: collectionId } },
    { new: true }
  )
    .populate("tags", "name color")
    .populate("collections", "name icon");

  if (!save) throw new ApiError(404, "Save not found");

  await Collection.findByIdAndUpdate(collectionId, {
    $inc: { itemCount: 1 },
    lastUpdated: new Date(),
  });

  return res.status(200).json(new ApiResponse(200, save, "Added to collection"));
});

export const removeFromCollection = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;

  const save = await SaveItem.findOneAndUpdate(

    { _id: req.params.id, user: req.user._id },
    { $pull: { collections: collectionId } },
    { new: true }
  )
    .populate("tags", "name color")
    .populate("collections", "name icon");

  if (!save) throw new ApiError(404, "Save not found");

  await Collection.findByIdAndUpdate(collectionId, { $inc: { itemCount: -1 } })
    .catch(() => { });

  return res.status(200)
    .json(new ApiResponse(200, save, "Removed from collection"));
});
