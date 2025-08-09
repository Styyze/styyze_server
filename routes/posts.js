import express from 'express'

import {post, getPosts,getUserPosts, getUsersWhoLikedPost} from '../controllers/posts.js'

const router = express.Router();


router.post('/posts', post);
router.get('/posts/all',getPosts);
router.get('/posts/:userId', getUserPosts);
router.get('/post_likes/:postId', getUsersWhoLikedPost);

export default router