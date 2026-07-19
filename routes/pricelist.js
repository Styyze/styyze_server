import express from 'express'
import { protect } from '../middleware/auth.js';

import {createPriceList } from '../controllers/pricelist.js';

const router = express.Router();


router.post('/houses/pricelist/create', protect, createPriceList);

export default router