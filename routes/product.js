import express from 'express'

import {createProduct } from '../controllers/product.js'
import { protect } from '../middleware/auth.js';
import { authorize} from '../middleware/authorize.js';


import {getAllProducts, } from '../controllers/getProducts.js';
import {getProductById, getProductsBySellerId} from '../controllers/product.js';
const router = express.Router();

router.post('/', protect, authorize('seller'), createProduct ); 
router.get("/getAllProducts", getAllProducts);
router.get("/:productId",getProductById);
router.get("/ProductBySeller/:seller", getProductsBySellerId);




export default router