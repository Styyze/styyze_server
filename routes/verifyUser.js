import express from 'express'

import {verifyUser } from '../controllers/verifyUser.js'



const router = express.Router();

router.patch('/verify/:userId', verifyUser); 





export default router