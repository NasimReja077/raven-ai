// src/routes/graph.routes.js
import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { getGraph } from "../controllers/graph.controller.js";
 
const router = express.Router();
router.use(protect);
 
// GET /api/graph
router.get("/", getGraph);
 
export default router;