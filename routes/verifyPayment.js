import express from "express";
import { verifyPayment, paystackWebhook } from "../controllers/verifyPayment.js";

const router = express.Router();

// Called after redirect
router.get("/verify/:reference", verifyPayment);

// Called by Paystack webhook
router.post("/webhook", express.json({ type: "*/*" }), paystackWebhook);

export default router;