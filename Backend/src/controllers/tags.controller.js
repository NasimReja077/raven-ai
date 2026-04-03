// src/controllers/tags.controller.js
import Tag from "../models/Tag.models.js";
import { SaveItem } from "../models/SaveItem.models.js";
import ApiError from "../utils/ApiError.js";
import  ApiResponse  from "../utils/ApiResponse.js";
import asyncHandler  from "../utils/asyncHandler.js";
import { addReprocessJob } from "../jobs/save.queue.js";

// POST /api/v1/tags

export const createTag = asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) throw new ApiError(400, "Tag name is required");

  // Tag model has unique index on { user, name } — will throw 11000 on duplicate // 
  const tag = await Tag.create({
    user: req.user._id,
    name: name.trim().toLowerCase(),
    color: color || "#7555f8",
  });

  return res.status(201).json(new ApiResponse(201, tag, "Tag created"));
});

// GET /api/v1/tags

export const getAllTags = asyncHandler(async (req, res) => {
  const { includeArchived = "false" } = req.query;
  
  const filter = { user: req.user._id };

  if (includeArchived !== "true") filter.isArchived = false;

  const tags = await Tag.find(filter).sort({ usageCount: -1, name: 1 }).lean();

  // Attach live save count to each tag
  const tagsWithCount = await Promise.all(
    tags.map(async (tag) => ({
      ...tag,
      saveCount: await SaveItem.countDocuments({ user: req.user._id, tags: tag._id, isArchived: false }),
    }))
  );
  return res.status(200).json(new ApiResponse(200, tagsWithCount, "Tags fetched"));
});

// GET /api/v1/tags/:id

export const getTagById = asyncHandler(async (req, res) => {
  const tag = await Tag.findOne({ 
     _id: req.params.id, 
     user: req.user._id 
});
  if (!tag) throw new ApiError(404, "Tag not found");

  const saveCount = await SaveItem.countDocuments({
    user: req.user._id,
    tags: tag._id,
    isArchived: false,
  });

  return res.status(200).json(
    new ApiResponse(200, { ...tag.toObject(), saveCount }, "Tag fetched")
  );
});

// PATCH /api/v1/tags/:id

export const updateTag = asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  const updates = {};
  if (name) updates.name = name.trim().toLowerCase();
  if (color) updates.color = color;
  if (!Object.keys(updates).length) throw new ApiError(400, "No valid fields to update");

  const tag = await Tag.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!tag) throw new ApiError(404, "Tag not found");
  return res.status(200).json(new ApiResponse(200, tag, "Tag updated"));
});

// DELETE /api/v1/tags/:id

export const deleteTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tag) throw new ApiError(404, "Tag not found");

  // Remove reference from all saves (fire-and-forget)
  SaveItem.updateMany(
    { user: req.user._id, tags: tag._id },
    { $pull: { tags: tag._id } }
  ).catch(() => {});
  return res.status(200).json(new ApiResponse(200, null, "Tag deleted"));
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/tags/:id/archive   → soft-delete
// ─────────────────────────────────────────────────────────────────────────────
export const archiveTag = asyncHandler(async (req, res) => {
  const { archive = true } = req.body;

  const tag = await Tag.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isArchived: Boolean(archive) } },
    { new: true }
  );
  if (!tag) throw new ApiError(404, "Tag not found");

  return res.status(200).json(
    new ApiResponse(200, tag, archive ? "Tag archived" : "Tag unarchived")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/tags/:id/saves/:saveId   → add tag to save
// FIX: embedSave (re-embedding) was called AFTER the return — unreachable.
//      Now called BEFORE the return (fire-and-forget, non-blocking).
// ─────────────────────────────────────────────────────────────────────────────
export const addTagToSave = asyncHandler(async (req, res) => {
  const { id: tagId, saveId } = req.params;

  const tag = await Tag.findOne({ _id: tagId, user: req.user._id });
  if (!tag) throw new ApiError(404, "Tag not found");

  const save = await SaveItem.findOneAndUpdate(
    { _id: saveId, user: req.user._id },
    { $addToSet: { tags: tagId } },
    { new: true }
  )
    .populate("tags", "name color")
    .populate("collections", "name icon")
  if (!save) throw new ApiError(404, "Save not found");

  // Increment tag usage count
  Tag.findByIdAndUpdate(tagId, { $inc: { usageCount: 1 } }).catch(() => {});

  // FIX: trigger re-embedding BEFORE returning — was unreachable after return
  addReprocessJob({ saveId, userId: req.user._id, full: false }).catch(() => {});

  return res.status(200).json(new ApiResponse(200, save, "Tag added to save"));
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/tags/:id/saves/:saveId   → remove tag from save
// FIX: same unreachable embedSave bug — fixed here too
// ─────────────────────────────────────────────────────────────────────────────
export const removeTagFromSave = asyncHandler(async (req, res) => {
  const { id: tagId, saveId } = req.params;

  const save = await SaveItem.findOneAndUpdate(
    { _id: saveId, user: req.user._id },
    { $pull: { tags: tagId } },
    { new: true }
  )
    .populate("tags", "name color")
    .populate("collections", "name icon");

  if (!save) throw new ApiError(404, "Save not found");

  // FIX: non-blocking re-embedding BEFORE return (was unreachable)
  addReprocessJob({ saveId, userId: req.user._id, full: false }).catch(() => {});

  return res.status(200).json(new ApiResponse(200, save, "Tag removed from save"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tags/:id/saves   → all saves with this tag
// ─────────────────────────────────────────────────────────────────────────────
export const getSavesByTag = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const tag = await Tag.findOne({ _id: req.params.id, user: req.user._id });
  if (!tag) throw new ApiError(404, "Tag not found");

  const skip = (Number(page) - 1) * Number(limit);

  const [saves, total] = await Promise.all([
    SaveItem.find({ user: req.user._id, tags: tag._id, isArchived: false })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("tags", "name color").populate("collections", "name icon"),
    SaveItem.countDocuments({ user: req.user._id, tags: tag._id, isArchived: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      tag,
      saves,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, "Saves by tag fetched")
  );
});