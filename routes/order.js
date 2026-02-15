import express from 'express'

import {
    createOrder,
    getOrdersBySellerId, 
    getOrdersByBuyerId,
    getOrderById,
    updateOrderDetails 
} from '../controllers/order.js'



const router = express.Router();



router.post('/order', createOrder ); 

router.get("/getOrders/:seller", getOrdersBySellerId);
router.get("/buyerOrder/:buyer", getOrdersByBuyerId);
router.get('/order/:orderId', getOrderById);
router.patch('/order/update/:orderId',updateOrderDetails);




export default router