import express from 'express'

import {
    createCartItems,
      getCartByUserId,
} from '../controllers/cart.js'



const router = express.Router();


router.get('/items/:buyerId', getCartByUserId);
router.post('/items', createCartItems); 






export default router