import express from 'express'

import {
    createOrder,
    getOrdersBySellerId, 
    getOrdersByBuyerId,
    getOrderById 
} from '../controllers/order.js'



const router = express.Router();



router.post('/order', createOrder ); 

router.get("/getOrders/:seller", getOrdersBySellerId);
router.get("/buyerOrder/:buyer", getOrdersByBuyerId);
router.get('/order/:orderId', getOrderById);




export default router