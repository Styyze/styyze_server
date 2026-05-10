import express from 'express'
import { protect } from '../middleware/auth.js';

import {post, deletePost, 
    getPostsWithComments,
    getUserPosts, 
    getPostById,
    getUsersWhoLikedPost, 
    updatePost} from '../controllers/posts.js'

const router = express.Router();


router.post('/posts', post);
router.get('/posts/all',getPostsWithComments);
router.get('/posts_by_user/:userId', getUserPosts);
router.patch('/post_update/:postId', updatePost);
router.get('/post_likes/:postId', getUsersWhoLikedPost);
router.get('/get_post/:postId', getPostById);
router.delete('/deletePost/:postId', protect, deletePost)

export default router