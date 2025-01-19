import express from 'express'

import {post} from '../controllers/posts.js'



const router = express.Router();


router.post('/posts', post)


export default router