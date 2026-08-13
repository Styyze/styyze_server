import express from "express";

import { inviteStaff, createHouse, searchHouse, getHouseStaff,
     getInvitations} from "../controllers/houseMembership.js";


import { protect } from '../middleware/auth.js';


const router = express.Router();
router.get("/houses/name/search", protect, searchHouse);

router.post("/houses/create", protect, createHouse);
router.get("/houses/staff/invitation", protect, getInvitations);
router.post( "/houses/staff/invite", protect, inviteStaff);
router.get("/get/staff/:houseId", getHouseStaff);



export default router;


