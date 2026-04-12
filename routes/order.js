import express from 'express'
import { protect } from '../middleware/auth.js';

import {
    createPreOrder,
    getPreOrderById,
    getOrdersBySellerId, 
    getOrdersByBuyerId,
    getOrderById,
    createCheckoutDetails,
    createBuyNowPreOrder,
    updateCheckoutDetails, 
    initiateCheckout,
} from '../controllers/order.js'



const router = express.Router();



router.post('/preorder', protect, createPreOrder ); 
router.post('/buy_now', protect, createBuyNowPreOrder);
router.get("/getOrders/:seller", getOrdersBySellerId);
router.get("/buyerOrder/:buyer", getOrdersByBuyerId);
router.get('/order/:orderId', getOrderById);
router.get('/preorder/:preorderId',getPreOrderById );
router.post('/order/checkout-details/:preOrderId', protect, createCheckoutDetails);
router.patch('/order/updateCheckoutDetails/:preOrderId', protect, updateCheckoutDetails );
router.post("/order/pay", protect, initiateCheckout);




export default router