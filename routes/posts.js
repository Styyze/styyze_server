import express from 'express'

import {post, getPosts,getPostById, getUsersWhoLikedPost} from '../controllers/posts.js'

const router = express.Router();


router.post('/posts', post);
router.get('/posts/all',getPosts);
router.get('/posts/:postId', getPostById);
router.get('/post_likes/:postId', getUsersWhoLikedPost);

export default router