import express from 'express'

import {
    createPreOrder,
    getOrdersBySellerId, 
    getOrdersByBuyerId,
    getOrderById,
    updateCheckoutDetails, 
    createCheckoutDetails,
    initiateCheckout   
} from '../controllers/order.js'



const router = express.Router();



router.post('/preorder', createPreOrder ); 
router.post('/checkout',initiateCheckout )
router.get("/getOrders/:seller", getOrdersBySellerId);
router.get("/buyerOrder/:buyer", getOrdersByBuyerId);
router.get('/order/:orderId', getOrderById);
router.post('/order/checkout-details/:preorderId', createCheckoutDetails);
router.patch('/order/updateCheckoutDetails/:preOrderId',updateCheckoutDetails );




export default router