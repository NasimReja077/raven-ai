// src/routes/clustering.routes.js
import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
     runClustering,
     runDBSCANClustering,
     suggestParams,
     getClusters,
     getClusterSaves,
} from "../controllers/clustering.controller.js";

const router = express.Router();
router.use(protect);

// K-Means
router.post("/run", runClustering);

// DBSCAN
router.post("/dbscan", runDBSCANClustering);
router.get("/dbscan/suggest", suggestParams);

// Shared
router.get("/", getClusters);
router.get("/:clusterId/saves", getClusterSaves);

export default router;