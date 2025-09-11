import express from 'express'

import {getVideos } from '../controllers/explore_vids.js'

const router = express.Router();


router.get('/posts/videos',getVideos);

export default router