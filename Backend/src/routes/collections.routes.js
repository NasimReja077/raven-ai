import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
     createCollection, getAllCollections, getCollectionById,
     updateCollection, 
     deleteCollection, getCollectionSaves,
     addSaveToCollection, removeSaveFromCollection, reorderCollectionSaves,
} from "../controllers/collections.controller.js";

const router = express.Router();
router.use(protect);

router.post("/", createCollection);
router.get("/", getAllCollections);
router.get("/:id", getCollectionById);
router.patch("/:id", updateCollection);
router.delete("/:id", deleteCollection);
router.get("/:id/saves", getCollectionSaves);
router.post("/:id/saves", addSaveToCollection);
router.delete("/:id/saves/:saveId", removeSaveFromCollection);
router.patch("/:id/reorder", reorderCollectionSaves);

export default router;