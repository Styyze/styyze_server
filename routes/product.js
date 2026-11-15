import express from 'express'

import {createProduct } from '../controllers/product.js'
import { protect } from '../middleware/auth.js';
import { authorize} from '../middleware/authorize.js';


import {getAllProducts, } from '../controllers/getProducts.js';
import {getProductById,deleteProduct, getProductsBySellerId, getCollection, updateProduct} from '../controllers/product.js';

const router = express.Router();
router.get("/house/collections/:houseId", getCollection);
router.post('/', protect, authorize('seller'), createProduct ); 
router.get("/getAllProducts", getAllProducts);
router.get("/:productId",getProductById);
router.get("/ProductBySeller/:seller", getProductsBySellerId);
router.patch( "/update/:productId", protect, updateProduct);
router.delete("/delete/:productId", protect, deleteProduct);

export default router