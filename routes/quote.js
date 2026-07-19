import express from "express";

import {respondToQuotedPrice,houseRespondToQuote} from "../controllers/quote.js";


import { protect } from '../middleware/auth.js';


const router = express.Router();


router.patch( "/projects/:projectId/respond/customer",  protect,  respondToQuotedPrice);
router.patch( "/projects/:projectId/respond/house",  protect,  houseRespondToQuote);



export default router;


