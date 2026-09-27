// routes/notificationRoutes.js

import express from "express";

import {
    getUserNotifications
} from "../controllers/notificationServices.js";

import {protect} from "../middleware/auth.js";

const router = express.Router();


// Get notifications for logged-in user
router.get( "/notifications", protect, getUserNotifications);

export default router;