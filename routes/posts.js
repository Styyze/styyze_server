import express from 'express'

import {post, getPosts,getPostById} from '../controllers/posts.js'


const router = express.Router();


router.post('/posts', post)
router.get('/posts/all',getPosts)
router.get('/posts/:postId', getPostById)

export default router