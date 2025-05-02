import express from 'express'

import {getAllLike } from '../controllers/like.js'



const router = express.Router();


router.get('/unlike', getAllLike )


export default router