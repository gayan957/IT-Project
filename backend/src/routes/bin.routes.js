// routes/bin.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import {
  getMyBins,
  createBin,
  updateBin,
  deleteBin,
  getCurrentFillLevel,
  getPollingStatus,
} from "../controllers/bin.controller.js";
import { resetBinWeight } from "../controllers/collection.controller.js";

const router = Router();

// Authenticated user routes
router.get("/", auth, authorize("user", "admin"), getMyBins);
router.post("/", auth, authorize("user", "admin"), createBin);
router.put("/:id", auth, authorize("user", "admin"), updateBin);
router.delete("/:id", auth, authorize("user", "admin"), deleteBin);

// Agent routes for bin management
router.put("/:id/reset-weight", auth, authorize("pickupagent"), resetBinWeight);

// Blynk polling routes (public for real-time data)
router.get("/fill", getCurrentFillLevel);
router.get("/status", getPollingStatus);

export default router;
