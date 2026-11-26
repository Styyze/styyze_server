import express from "express";
import { verifyPayment, paystackWebhook, verifyProjectPayment } from "../controllers/verifyPayment.js";

const router = express.Router();

// Called after redirect
router.get("/verify/:reference", verifyPayment);
router.get( "/projects/verify-payment/:reference", verifyProjectPayment);

// Called by Paystack webhook
router.post(
  "/webhook",
  express.json({
    type: "*/*",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }),
  paystackWebhook
);

export default router;