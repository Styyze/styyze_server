import express from 'express'

import {
    createCartItems,
      
} from '../controllers/cart.js'



const router = express.Router();



router.post('/items', createCartItems); 






export default router