import express from 'express'
import { protect } from '../middleware/auth.js';

import {createPriceList,
        deletePriceList, 
        updatePriceList,
        getPriceListById, 
        getHousePriceList   }
 from '../controllers/pricelist.js';

const router = express.Router();


router.post('/houses/pricelist/create', protect, createPriceList);
router.get('/houses/pricelist', protect, getHousePriceList)

router.delete('/houses/price-list/:id/delete', protect, deletePriceList);
router.patch('/houses/price-list/:id/update', protect, updatePriceList );
router.get('/houses/:pricelistId', protect, getPriceListById );
export default router