import express from 'express'

import {unfollowUser} from '../controllers/follow.js'




const router = express.Router();


router.post('/unfollow',unfollowUser)


export default router