import express from 'express'

import {CreateUserProfile} from '../controllers/userProfile.js'
import {getUserProfile} from '../controllers/userProfile.js'




const router = express.Router();


router.post('/userProfile', CreateUserProfile);
router.get('/userProfile/:id',getUserProfile);


export default router;