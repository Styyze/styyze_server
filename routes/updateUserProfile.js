import express from 'express'

import {updateUserProfile} from '../controllers/userProfile.js';
import {authenticate} from '../controllers/authmiddleware.js';

const router = express.Router();

router.patch('/updateUserProfile',authenticate, updateUserProfile)


export default router;