import express from 'express'

import {post} from '../controllers/posts.js'
import {getPosts} from '../controllers/posts.js'




const router = express.Router();


router.post('/posts', post)
router.get('/posts/all',getPosts)


export default router