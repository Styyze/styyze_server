import express from 'express'
import { protect } from '../middleware/auth.js';

import {createPriceList,
        deletePriceList, 
        updatePriceList,
        getPriceListById, 
        getHousePriceList   }
 from '../controllers/pricelist.js';

const router = express.Router();


router.post('/houses/create/pricelist', protect, createPriceList);
router.get('/houses/pricelist', protect, getHousePriceList)

router.delete('/houses/price-list/:id/delete', protect, deletePriceList);
router.get('/houses/:pricelistId', protect, getPriceListById );

router.patch('/houses/price-list/:id/update', protect, updatePriceList );

export default router