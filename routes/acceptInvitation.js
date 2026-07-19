import express from "express";

import {acceptStaffInvitation} from "../controllers/acceptInvitation.js";


import { protect } from '../middleware/auth.js';


const router = express.Router();


router.patch( "/staff/invitation/accept/:houseId", protect, acceptStaffInvitation);



export default router;


