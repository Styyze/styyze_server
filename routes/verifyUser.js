import express from 'express'
import { protect } from '../middleware/auth.js';

import {approveSeller, rejectSeller } from '../controllers/verifyUser.js'
import {submitSellerVerification} from '../controllers/submitVeriDocs.js'


const router = express.Router();

router.patch('/verify/admin/:userId', approveSeller); 
router.post("/verify/documents", protect, submitSellerVerification);
router.patch('reject/admin/:houseId', rejectSeller);





export default router