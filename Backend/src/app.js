// src/app.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import { apiLimiter } from "./middlewares/rateLimitMiddleware.js";
import errorHandler from "./middlewares/errorMiddleware.js";

// ─── CRITICAL: Import all models here so Mongoose registers their schemas
//     before any route handler tries to .populate() them.
//     Without this, populate("tags") throws:
//     "Schema hasn't been registered for model 'Tag'"
import "./models/User.model.js";
import "./models/SaveItem.models.js";
import "./models/Tag.models.js";
import "./models/Collection.models.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import savesRouter from "./routes/saves.routes.js";
import collectionsRouter from "./routes/collections.routes.js";
import tagsRouter from "./routes/tags.routes.js";

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

app.use("/api", apiLimiter);

// Route mounting
app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);
app.use("/api/saves", savesRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/tags", tagsRouter);

app.get("/", (req, res) => res.send("Raven AI running..."));
app.get("/health", (req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV }),
);

app.use(errorHandler);

export default app;
