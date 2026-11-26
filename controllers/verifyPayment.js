import axios from "axios";
import CheckoutSession from "../models/CheckoutSession.js";
import CheckoutDetails from "../models/CheckoutDetails.js";
import {createNotification } from './notificationServices.js';
import Project from "../models/Project.js";
import House from "../models/House.js";
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
      return res.status(200).json({ success: true,
         message: "Session not found",
         data:[]
         });
    }

    // Prevent double-processing
    if (session.paymentStatus === "success") {
      return res.json({ success: true, message: "Payment already verified" });
    }

    // Update database
    session.paymentStatus = "success";
    await session.save();

    await PreOrder.findByIdAndUpdate(session.preorderId, { status: "paid" });
    await CheckoutDetails.findOneAndUpdate({preorderId:session.preorderId}, { status: "paid" });

    await CheckoutSession.updateMany(
        { 
          preorderId: session.preorderId, 
          paymentReference: { $ne: reference }, 
          paymentStatus: "pending" 
        },
        { $set: { paymentStatus: "cancelled" } }
    );


    res.json({ success: true, message: "Payment verified successfully", session });

  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// verify payment for project

export const verifyProjectPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required"
      });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = response.data.data;

    if (data.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment was not successful"
      });
    }

    const session = await CheckoutSession.findOne({
      paymentReference: reference
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Project payment session not found"
      });
    }

    if (!session.projectId) {
      return res.status(400).json({
        success: false,
        message: "This reference is not associated with a project payment"
      });
    }

    if (session.paymentStatus === "success") {
      return res.status(200).json({
        success: true,
        message: "Project payment already verified",
        data: {
          projectId: session.projectId,
          paymentStatus: session.paymentStatus
        }
      });
    }

    if (session.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This payment session is no longer pending"
      });
    }

    if (
      Number(data.amount) !== Number(session.amountInKobo) ||
      data.currency !== session.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency does not match"
      });
    }

    const project = await Project.findById(session.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Associated project not found"
      });
    }

    if (project.paymentReference !== reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference does not match the project"
      });
    }

    if (
      project.paymentStatus === "paid" ||
      project.status === "paid"
    ) {
      return res.status(409).json({
        success: false,
        message: "Project has already been paid for"
      });
    }

    const updatedSession = await CheckoutSession.findOneAndUpdate(
      {
        _id: session._id,
        paymentStatus: "pending"
      },
      {
        $set: {
          paymentStatus: "success"
        }
      },
      {
        new: true
      }
    );

    if (!updatedSession) {
      const latestSession = await CheckoutSession.findById(
        session._id
      );

      if (latestSession?.paymentStatus === "success") {
        return res.status(200).json({
          success: true,
          message: "Project payment already verified"
        });
      }

      return res.status(409).json({
        success: false,
        message: "Payment session could not be updated"
      });
    }

    project.paymentStatus = "paid";
    await project.save();

    await CheckoutSession.updateMany(
      {
        projectId: project._id,
        paymentReference: {
          $ne: reference
        },
        paymentStatus: "pending"
      },
      {
        $set: {
          paymentStatus: "cancelled"
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Project payment verified successfully",
      data: {
        projectId: project._id,
        paymentReference: reference,
        paymentStatus: updatedSession.paymentStatus,
        amount: updatedSession.totalAmount,
        currency: updatedSession.currency
      }
    });

  } catch (error) {
    console.error(
      "Project payment verification error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to verify project payment"
    });
  }
};
// paystack webhook

export const paystackWebhook = async (req, res) => {
  console.log("Paystack webhook received!");

  try {
    const signature = req.headers["x-paystack-signature"];

    if (!req.rawBody || !signature) {
      return res.status(400).send("Missing webhook signature or raw body");
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(hash, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;

    if (event.event !== "charge.success") {
      return res.status(200).send("Event ignored");
    }

    const data = event.data;
    const reference = data.reference;

    if (data.status !== "success") {
      return res.status(200).send("Payment was not successful");
    }

    const session = await CheckoutSession.findOne({
      paymentReference: reference
    });

    if (!session) {
      console.error("Checkout session not found:", reference);

      return res.status(200).send("Checkout session not found");
    }

    if (session.projectId) {
      return await handleProjectPayment(
        req,
        res,
        session,
        data,
        reference
      );
    }

    if (session.preorderId) {
      return await handlePreOrderPayment(
        res,
        session,
        data,
        reference
      );
    }

    console.error("Unknown checkout session type:", session._id);

    return res.status(200).send("Unknown payment type");

  } catch (error) {
    console.error(
      "Paystack webhook error:",
      error.response?.data || error.message
    );

    return res.status(500).send("Webhook error");
  }
};




const handlePreOrderPayment = async (
  res,
  session,
  data,
  reference
) => {
  if (session.paymentStatus === "success") {
    return res.status(200).send("Preorder payment already processed");
  }

  if (
    Number(data.amount) !== Number(session.amountInKobo) ||
    data.currency !== session.currency
  ) {
    console.error("Preorder payment amount mismatch:", reference);

    return res.status(200).send("Payment amount mismatch");
  }

  const updatedSession = await CheckoutSession.findOneAndUpdate(
    {
      _id: session._id,
      paymentStatus: "pending"
    },
    {
      $set: {
        paymentStatus: "success"
      }
    },
    {
      new: true
    }
  );

  if (!updatedSession) {
    return res.status(200).send("Preorder payment already processed");
  }

  await PreOrder.findByIdAndUpdate(
    session.preorderId,
    {
      $set: {
        status: "paid"
      }
    }
  );

  // Update checkout details
  await CheckoutDetails.findOneAndUpdate(
    {
      preorderId: session.preorderId
    },
    {
      $set: {
        status: "paid"
      }
    }
  );

  await CheckoutSession.updateMany(
    {
      preorderId: session.preorderId,
      paymentReference: {
        $ne: reference
      },
      paymentStatus: "pending"
    },
    {
      $set: {
        paymentStatus: "cancelled"
      }
    }
  );

  return res.status(200).send("Preorder payment processed successfully");
};




const handleProjectPayment = async (
  req,
  res,
  session,
  data,
  reference
) => {
  if (session.paymentStatus === "success") {
    return res.status(200).send("Project payment already processed");
  }

  if (
    Number(data.amount) !== Number(session.amountInKobo) ||
    data.currency !== session.currency
  ) {
    console.error("Project payment amount mismatch:", reference);

    return res.status(200).send("Payment amount mismatch");
  }

  // Find project
  const project = await Project.findById(session.projectId);

  if (!project) {
    console.error("Project not found:", session.projectId);

    return res.status(200).send("Project not found");
  }

  if (project.paymentReference !== reference) {
    console.error("Project payment reference mismatch:", reference);

    return res.status(200).send("Payment reference mismatch");
  }

  const updatedSession = await CheckoutSession.findOneAndUpdate(
    {
      _id: session._id,
      paymentStatus: "pending"
    },
    {
      $set: {
        paymentStatus: "success"
      }
    },
    {
      new: true
    }
  );

  if (!updatedSession) {
    return res.status(200).send("Project payment already processed");
  }

  // Update project
  project.paymentStatus = "paid";
  await project.save();

  // Cancel other pending sessions for this project
  await CheckoutSession.updateMany(
    {
      projectId: project._id,
      paymentReference: {
        $ne: reference
      },
      paymentStatus: "pending"
    },
    {
      $set: {
        paymentStatus: "cancelled"
      }
    }
  );

  // Find House
  const house = await House.findById(project.houseId);

  // Create notification
  if (house) {
    try {
      await createNotification({
        recipientId: house.ownerId,

        type: "payment_received",

        title: `Payment received for project ${project._id}`,

        body: `Payment of ${session.currency} ${session.totalAmount} has been received for your project.`,

        meta: {
          amount: session.totalAmount,
          currency: session.currency,
          source: "project_payment",
          projectId: project._id,
          houseId: house._id,
          paymentReference: reference
        },

        actionUrl: "/finance"
      });

    } catch (notificationError) {
      console.error(
        "Project payment notification failed:",
        notificationError.message
      );
    }
  }

  return res.status(200).send("Project payment processed successfully");
};