import express from "express";

import { getGarmentTypes, createGarmentType} from "../controllers/garmentType.js";


import { protect } from '../middleware/auth.js';

import { requireHouseStaff} from "../middleware/houseAccess.js";



const router = express.Router();



// Public search
router.get( "/garment-types",getGarmentTypes);



router.post( "/garment-types", protect, requireHouseStaff, createGarmentType);



export default router;