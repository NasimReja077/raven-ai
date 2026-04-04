// src/controllers/fileUpload.controller.js

import { SaveItem } from "../models/SaveItem.models.js";
import { Collection } from "../models/Collection.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import cloudinary from "../config/cloudinary.config.js";
import { addSaveJob } from "../jobs/save.queue.js";
import fs from "fs";

import { CLOUDINARY_FOLDERS } from "../config/cloudinary.config.js";


// POST /api/saves/upload

export const uploadSaveFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const { userNote = "", collectionIds, tags } = req.body;
  const parsedCollections = collectionIds
    ? JSON.parse(collectionIds)
    : [];
  const parsedTags = tags ? JSON.parse(tags) : [];

  const { originalname, mimetype, size, path: localPath } = req.file;

  // Determine resource type for Cloudinary
  const isPDF   = mimetype === "application/pdf";
  const isImage = mimetype.startsWith("image/");

  if (!isPDF && !isImage) {
    fs.unlinkSync(localPath);
    throw new ApiError(400, "Only PDF and image files are supported");
  }

  // Upload to Cloudinary
  let cloudinaryResult;
  try {
    cloudinaryResult = await cloudinary.uploader.upload(localPath, {
      folder: CLOUDINARY_FOLDERS.SAVE_FILES,
      resource_type: isPDF ? "raw" : "image",
      public_id: `${req.user._id}_${Date.now()}_${originalname.replace(/\s+/g, "_")}`,
      use_filename:  true,
      overwrite:     false,
    });
  } catch (err) {
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    throw new ApiError(500, `Cloudinary upload failed: ${err.message}`);
  }

  // Clean up local temp file
  if (fs.existsSync(localPath)) fs.unlinkSync(localPath);

  const fileUrl   = cloudinaryResult.secure_url;
  const publicId  = cloudinaryResult.public_id;
  const fileType  = isPDF ? "pdf" : "image";

  // Create SaveItem
  const saveItem = await SaveItem.create({
    user: req.user._id,
    url: fileUrl,                          // Cloudinary URL as the URL
    title: originalname.replace(/\.[^.]+$/, "") || "Uploaded File",
    description: "",
    thumbnail: isImage ? fileUrl : "",
    type: fileType,
    fileUrl,
    fileType: mimetype,
    fileSize: size,
    publicId,
    userNote,
    tags: parsedTags,
    collections: parsedCollections,
    source: "upload",
    processingStatus: "pending",
    "sourceMeta.platform": fileType,
  });

  // Update collection counts
  if (parsedCollections.length) {
    await Collection.updateMany(
      { _id: { $in: parsedCollections }, user: req.user._id },
      { $inc: { itemCount: 1 }, lastUpdated: new Date() }
    );
  }

  // Enqueue background processing (worker will call scrapeContent with the URL)
  try {
    await addSaveJob({ saveId: saveItem._id, userId: req.user._id });
  } catch (err) {
    console.error("Queue failed for uploaded file:", err.message);
    await SaveItem.findByIdAndUpdate(saveItem._id, { processingStatus: "failed" });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, saveItem, "File uploaded! AI processing in background…"));
});

// DELETE /api/saves/:id/file

export const deleteSaveFile = asyncHandler(async (req, res) => {
  const save = await SaveItem.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!save) throw new ApiError(404, "Save not found");
  if (!save.publicId) throw new ApiError(400, "No file attached to this save");

  try {
    await cloudinary.uploader.destroy(save.publicId, {
      resource_type: save.fileType?.includes("pdf") ? "raw" : "image",
    });
  } catch (err) {
    console.warn("Cloudinary delete failed:", err.message);
  }

  await SaveItem.findByIdAndUpdate(req.params.id, {
    $set: { fileUrl: null, fileType: null, fileSize: null, publicId: "" },
  });

  return res.status(200).json(new ApiResponse(200, null, "File removed from save"));
});