import express from 'express'
import { protect } from '../middleware/auth.js';

import {approveSeller } from '../controllers/verifyUser.js'
import {submitSellerVerification} from '../controllers/submitVeriDocs.js'


const router = express.Router();

router.patch('/verify/admin/:userId', approveSeller); 
router.post("/verify/documents", protect, submitSellerVerification);





export default router