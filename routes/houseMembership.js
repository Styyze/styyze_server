import express from "express";

import { inviteStaff, createHouse, getInvitations} from "../controllers/houseMembership.js";


import { protect } from '../middleware/auth.js';


const router = express.Router();

router.post("/houses/create", protect, createHouse);
router.get("/houses/staff/invitation", getInvitations);
router.post( "/houses/staff/invite", protect, inviteStaff);



export default router;


