import { Router } from "express";
import {
  GenerateHash,
  PayhereNotification,
  getPaymentHistory,
  getPaymentById,
  getAgentPayments,
  createPaymentRecord
} from "../controllers/payment.controller.js";
import { createTestPayment, testPaymentModel } from "../controllers/payment.test.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// Health check route for debugging
router.get("/payments/health", (req, res) => {
  res.json({
    success: true,
    message: "Payment routes are working",
    timestamp: new Date().toISOString(),
    user: req.user ? { id: req.user.id, role: req.user.role } : null
  });
});

// Simple test route without auth
router.get("/payments/simple-test", (req, res) => {
  res.json({
    success: true,
    message: "Simple payment route test successful",
    data: {
      payments: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    }
  });
});

// Payment processing routes
router.post("/payment/hash", auth, GenerateHash);
router.post("/payment/notify", PayhereNotification);

// Payment data retrieval routes
router.get("/payments/history", auth, getPaymentHistory);
router.get("/payments/agent/:agentId", auth, getAgentPayments);
router.get("/payments/:paymentId", auth, getPaymentById);

// Manual payment record creation (for testing/admin)
router.post("/payments/create", auth, createPaymentRecord);

// Test routes for debugging
router.post("/payments/test/create", auth, createTestPayment);
router.get("/payments/test/model", auth, testPaymentModel);

export default router;
