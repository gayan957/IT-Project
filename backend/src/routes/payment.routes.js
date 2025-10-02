import { Router } from "express";
import {
  GenerateHash,
  PayhereNotification,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/payment/hash", GenerateHash);
router.post("/payment/notify", PayhereNotification);

export default router;
