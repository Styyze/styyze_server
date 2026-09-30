import express from "express";

import { inviteStaff, createHouse, searchHouse, getInvitations} from "../controllers/houseMembership.js";


import { protect } from '../middleware/auth.js';
import { createTapeMeasurement, getTapeMeasurement } from "../controllers/tapeMeasurement.js";


const router = express.Router();

router.post("/measurements/tape", protect, createTapeMeasurement);
router.get("/measurement/user/tape", protect, getTapeMeasurement);




export default router;


