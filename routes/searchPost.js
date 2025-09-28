import express from 'express'


import {post_search} from '../controllers/search_post.js';



const router = express.Router();


router.get('/post/search', post_search)





export default router