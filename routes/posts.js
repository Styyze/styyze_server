import express from 'express'

import {post, getPosts,getUserPosts, getPostById,getUsersWhoLikedPost, updatePost} from '../controllers/posts.js'

const router = express.Router();


router.post('/posts', post);
router.get('/posts/all',getPosts);
router.get('/posts/:userId', getUserPosts);
router.patch('/post_update/:postId', updatePost);
router.get('/post_likes/:postId', getUsersWhoLikedPost);
router.get('/get_post/:postId', getPostById);

export default router