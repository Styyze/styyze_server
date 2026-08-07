import express from 'express'

import {updateUserProfile} from '../controllers/userProfile.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.patch('/updateUserProfile', protect, updateUserProfile)


export default router;