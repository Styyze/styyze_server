import express from 'express'

import {savePost } from '../controllers/savePost.js'

const router = express.Router();


router.post('/post/bookmark',savePost);


export default router