import axios from "axios";
import CheckoutSession from "../models/CheckoutSession.js";
import PreOrder from "../models/PreOrder.js";
import crypto from "crypto";



export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: "Reference is required" });
    }

    // Verify with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = response.data.data;

    // Check if payment was successful
    if (data.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment not successful" });
    }

    // Find the session in your database
    const session = await CheckoutSession.findOne({ paymentReference: reference });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Prevent double-processing
    if (session.paymentStatus === "success") {
      return res.json({ success: true, message: "Payment already verified" });
    }

    // Update database
    session.paymentStatus = "success";
    await session.save();

    await PreOrder.findByIdAndUpdate(session.preorderId, { status: "paid" });
    await CheckoutSession.updateMany(
        { 
          preorderId: session.preorderId, 
          paymentReference: { $ne: reference }, 
          paymentStatus: "pending" 
        },
        { $set: { paymentStatus: "cancelled" } }
    );
}

    res.json({ success: true, message: "Payment verified successfully", session });

  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


// paystack webhook

export const paystackWebhook = async (req, res) => {
  console.log("websocket received!");
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.rawBody);
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;

    // Handle payment success
    if (event.event === "charge.success") {
      const reference = event.data.reference;

      // Find session
      const session = await CheckoutSession.findOne({ paymentReference: reference });
      if (!session) return res.status(404).send("Session not found");

      // Update only if not already updated
      if (session.paymentStatus !== "success") {
        session.paymentStatus = "success";
        await session.save();

        await PreOrder.findByIdAndUpdate(session.preorderId, { status: "paid" });
      }
    }

    res.status(200).send("Webhook received");

  } catch (error) {
    console.error(error);
    res.status(500).send("Webhook error");
  }
};