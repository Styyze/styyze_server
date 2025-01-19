import express from 'express'


import {searchPost} from '../controllers/searchPost.js';



const router = express.Router();


router.get('/search', searchPost)





export default router