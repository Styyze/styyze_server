import express from "express";

import { inviteStaff} from "../controllers/houseMembership.js";


import { protect } from '../middleware/auth.js';


const router = express.Router();


router.post( "/houses/staff/invite", protect, inviteStaff);



export default router;


