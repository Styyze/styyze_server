import express from 'express'

import {getUsers} from '../controllers/users.js'




const router = express.Router();


router.post('/users',getUsers)




export default router