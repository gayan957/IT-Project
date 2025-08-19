// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

// Global middleware
app.use(cors());             // allow cross-origin calls (frontend -> backend)
app.use(express.json());     // parse JSON bodies
app.use(morgan("dev"));      // nice request logs

// A simple test route
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "trash2cash-backend" });
});

export default app;
