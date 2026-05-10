import express from 'express'
import { protect } from '../middleware/auth.js';

import {CreateUserProfile} from '../controllers/userProfile.js'
import {getUserProfile, updateUserProfile} from '../controllers/userProfile.js'




const router = express.Router();


router.post('/userProfile', CreateUserProfile);
router.get('/getUserProfile/:userId', getUserProfile);
//router.patch('/updateUserProfile', protect, updateUserProfile);
router.patch('/edit_userProfile', protect, updateUserProfile);


export default router;