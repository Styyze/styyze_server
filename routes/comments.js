import express from 'express'

import {postComments} from '../controllers/postComments.js'


const router = express.Router();


router.post('/post/comment', postComments)


export default router