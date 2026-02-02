import express from 'express'

import {createOrder, getOrdersBySellerId } from '../controllers/order.js'



const router = express.Router();



router.post('/order', createOrder ); 

router.get("/getOrders/:seller", getOrdersBySellerId);



export default router