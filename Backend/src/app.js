// src/app.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { apiLimiter } from "./middlewares/rateLimitMiddleware.js";
import errorHandler from "./middlewares/errorMiddleware.js";


// ─── CRITICAL: Import all models first (for populate to work)

import "./models/User.model.js";
import "./models/SaveItem.models.js";
import "./models/Tag.models.js";
import "./models/Collection.models.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import savesRouter from "./routes/saves.routes.js";
import collectionsRouter from "./routes/collections.routes.js";
import tagsRouter from "./routes/tags.routes.js";
import clusteringRouter  from "./routes/clustering.routes.js";
import graphRouter       from "./routes/graph.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "../public/dist")));

app.use("/api", apiLimiter);

// ─── Logging Middleware (Morgan)

if (process.env.NODE_ENV === "production") {
  app.use(morgan("dev"));
}

// Route mounting
app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);
app.use("/api/saves", savesRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/clusters", clusteringRouter);
app.use("/api/graph", graphRouter);

app.get("/", (req, res) => res.send("Raven AI running..."));

app.get("/health", (req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV }),
);

// Serve frontend for any other route
app.get("*path", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dist/index.html"));
});

app.use(errorHandler);

export default app;
