import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
     createTag, getAllTags, getTagById, updateTag, deleteTag,
     archiveTag, addTagToSave, removeTagFromSave, getSavesByTag,
} from "../controllers/tags.controller.js";

const router = express.Router();
router.use(protect);

router.post("/", createTag);
router.get("/", getAllTags);
router.get("/:id", getTagById);
router.patch("/:id", updateTag);
router.delete("/:id", deleteTag);
router.patch("/:id/archive", archiveTag);
router.get("/:id/saves", getSavesByTag);
router.post("/:id/saves/:saveId", addTagToSave);
router.delete("/:id/saves/:saveId", removeTagFromSave);

export default router;