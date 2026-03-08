import express from 'express'
import { protect } from '../middleware/auth.js';

import {
  updateCartItem,
    createCartItems,
      getCartByUserId,
      removeCartItem,
      deleteCart,
} from '../controllers/cart.js'



const router = express.Router();


router.get('/items/:buyerId', getCartByUserId);
router.post('/items', protect, createCartItems); 

router.patch("/:cartId/items/:productId", protect, updateCartItem );
router.delete("/:cartId/items/:productId", protect, removeCartItem);
router.delete("/:cartId", protect, deleteCart);






export default router