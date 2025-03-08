import express from 'express'

import {follow} from '../controllers/follow.js'
import {unfollowUser} from '../controllers/follow.js'




const router = express.Router();


router.post('/follow', follow)
router.post('/unfollow',unfollowUser)


export default router