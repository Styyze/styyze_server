import express from 'express'


import {getAllProducts, searchProduct} from '../controllers/getProducts.js';

const router = express.Router();

router.get("/getAllProducts", getAllProducts);
router.get("/search", searchProduct);





export default router