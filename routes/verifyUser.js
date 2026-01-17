import express from 'express'

import {approveSeller } from '../controllers/verifyUser.js'
import {submitSellerVerification} from '../controllers/submitVeriDocs.js'


const router = express.Router();

router.patch('/verify/admin/:userId', approveSeller); 
router.post("/verify/documents", submitSellerVerification);





export default router