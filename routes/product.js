import express from 'express'

import {createProduct } from '../controllers/product.js'
import { protect } from '../middleware/auth.js';
import { authorize} from '../middleware/authorize.js';


import {getAllProducts} from '../controllers/getProducts.js';

const router = express.Router();

router.post('/',  createProduct ); 
router.get("/getAllProducts", getAllProducts);





export default router