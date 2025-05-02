import express from 'express'

import {like} from '../controllers/like.js'



const router = express.Router();


router.post('/like', like)


export default router