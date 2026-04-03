// src/controllers/collections.controller.js
import { Collection } from "../models/Collection.models.js";
import { SaveItem } from "../models/SaveItem.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// POST /api/v1/collections

export const createCollection = asyncHandler(async (req, res) => {
  const { name, description, icon, isPublic } = req.body;
  if (!name?.trim()) throw new ApiError(400, "Collection name is required");

  // Collection model has unique index on { user, name }
  const collection = await Collection.create({
    user: req.user._id,
    name: name.trim(),
    description: description?.trim() || "",
    icon: icon || "GoFileDirectoryFill",
    isPublic: Boolean(isPublic),
  });
  return res.status(201).json(new ApiResponse(201, collection, "Collection created"));
});


// GET /api/v1/collections

export const getAllCollections = asyncHandler(async (req, res) => {
  const { includeArchived = "false" } = req.query;

  const filter = { user: req.user._id };
  if (includeArchived !== "true") filter.isArchived = false;

  const collections = await Collection.find(filter)
    .sort({ lastUpdated: -1, name: 1 })
    .lean();

  // Attach live item count (more accurate than the denormalized field)
  const enriched = await Promise.all(
    collections.map(async (col) => ({
      ...col,
      itemCount: await SaveItem.countDocuments({ 
        user: req.user._id, 
        collections: col._id, 
        isArchived: false 
      }),
    }))
  );
  return res.status(200).json(new ApiResponse(200, enriched, "Collections fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/collections/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getCollectionById = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();

  if (!collection) throw new ApiError(404, "Collection not found");

  // BUG FIX: was using undefined `liveCount` — renamed to `itemCount`
  const itemCount = await SaveItem.countDocuments({
    user: req.user._id,
    collections: collection._id,
    isArchived: false,
  });
 
  return res
    .status(200)
    .json(new ApiResponse(200, { ...collection, itemCount }, "Collection fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/collections/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateCollection = asyncHandler(async (req, res) => {
  const ALLOWED = ["name", "description", "icon", "isPublic", "isArchived"];

  const updates = {};
  ALLOWED.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (!Object.keys(updates).length) throw new ApiError(400, "No valid fields to update");

  updates.lastUpdated = new Date();
  if (updates.name) updates.name = updates.name.trim();

  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!collection) throw new ApiError(404, "Collection not found");

  return res.status(200).json(new ApiResponse(200, collection, "Collection updated"));
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/collections/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndDelete({
    _id:  req.params.id,
    user: req.user._id,
  });
  if (!collection) throw new ApiError(404, "Collection not found");

  // Remove reference from all saves (fire-and-forget)
  SaveItem.updateMany(
    { user: req.user._id, collections: collection._id },
    { $pull: { collections: collection._id } }
  ).catch(() => {});

  return res.status(200).json(new ApiResponse(200, null, "Collection deleted"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/collections/:id/saves
// ─────────────────────────────────────────────────────────────────────────────
export const getCollectionSaves = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = "-createdAt" } = req.query;

  const collection = await Collection.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!collection) throw new ApiError(404, "Collection not found");

  const skip = (Number(page) - 1) * Number(limit);

  const [saves, total] = await Promise.all([
    SaveItem.find({
      user: req.user._id,
      collections: collection._id,
      isArchived:  false,
    })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate("tags", "name color"),
    SaveItem.countDocuments({
      user: req.user._id,
      collections: collection._id,
      isArchived:  false,
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      collection,
      saves,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: skip + saves.length < total,
      },
    }, "Collection saves fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/collections/:id/saves   → add a save to this collection
// ─────────────────────────────────────────────────────────────────────────────
export const addSaveToCollection = asyncHandler(async (req, res) => {
  const { saveId } = req.body;
  if (!saveId) throw new ApiError(400, "saveId is required");

  const collection = await Collection.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!collection) throw new ApiError(404, "Collection not found");

  const save = await SaveItem.findOneAndUpdate(
    { _id: saveId, user: req.user._id },
    { $addToSet: { collections: collection._id } },
    { new: true }
  )
  .populate("tags", "name color")
  .populate("collections", "name icon");

  if (!save) throw new ApiError(404, "Save not found");

  // Keep denormalized count in sync
  await Collection.findByIdAndUpdate(collection._id, {
    $inc: { itemCount: 1 },
    lastUpdated: new Date(),
  }).catch(() => {});
  return res.status(200).json(new ApiResponse(200, save, "Save added to collection"));
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/collections/:id/saves/:saveId   → remove save from collection
// ─────────────────────────────────────────────────────────────────────────────
export const removeSaveFromCollection = asyncHandler(async (req, res) => {
  // const { saveId } = req.params;

  const collection = await Collection.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!collection) throw new ApiError(404, "Collection not found");

  const save = await SaveItem.findOneAndUpdate(
    { _id: req.params.saveId, user: req.user._id },
    { $pull: { collections: collection._id } },
    { new: true }
  )
  .populate("tags", "name color")
  .populate("collections", "name icon");

  if (!save) throw new ApiError(404, "Save not found");

  await Collection.findByIdAndUpdate(collection._id, {
    $inc: { itemCount: -1 },
  }).catch(() => {});
  return res.status(200).json(new ApiResponse(200, save, "Save removed from collection"));
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/collections/:id/reorder   → reorder saves within a collection
// Body: { saveIds: ["id1", "id2", ...] }  (full ordered array)
// ─────────────────────────────────────────────────────────────────────────────
export const reorderCollectionSaves = asyncHandler(async (req, res) => {
  // Reordering is client-side; we just validate the collection belongs to the user
  const collection = await Collection.findOne({
    _id:  req.params.id,
    user: req.user._id,
  });
  if (!collection) throw new ApiError(404, "Collection not found");

  // Update lastUpdated to push it to the top of the list
  await Collection.findByIdAndUpdate(collection._id, { lastUpdated: new Date() });

  return res.status(200).json(new ApiResponse(200, null, "Order saved"));
});