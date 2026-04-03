import express from "express";
import protect from "../middlewares/auth.middleware.js";
// import { uploadFile } from "../middlewares/uploadMiddleware.js";
import {
     createSave, getAllSaves, getSaveById, 
     updateSave, deleteSave,getSaveToResurface, 
     getSaveStats, getRelatedSaves, reprocessSave,
     addHighlight, deleteHighlight, addToCollection, 
     removeFromCollection,
} from "../controllers/saves.controller.js";
// import { getSimilarItems } from "../controllers/clustering.controller.js";

const router = express.Router();
router.use(protect);

router.post("/", createSave);
// router.post("/upload", uploadFile.single("file"), createSave);
router.get("/", getAllSaves);
router.get("/stats", getSaveStats);
router.get("/resurface", getSaveToResurface);
router.get("/:id", getSaveById);
router.get("/:id/related", getRelatedSaves);
// router.get("/:id/similar", getSimilarItems);       // clustering
router.patch("/:id", updateSave);
router.delete("/:id", deleteSave);
router.post("/:id/reprocess", reprocessSave);
router.post("/:id/highlights", addHighlight);
router.delete("/:id/highlights/:hId", deleteHighlight);
router.post("/:id/collections", addToCollection);
router.delete("/:id/collections/:collectionId", removeFromCollection);

export default router;