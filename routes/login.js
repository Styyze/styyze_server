import express from 'express'

import {login} from '../controllers/login.js'




const router = express.Router();


router.post("/signin", login);






export default router