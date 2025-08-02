import express from 'express'

import {toggleFollow, getFollowersInfo} from '../controllers/follow.js'


const router = express.Router();


router.post('/follow', toggleFollow)
router.get('/get_followers/:profileId',getFollowersInfo)


export default router