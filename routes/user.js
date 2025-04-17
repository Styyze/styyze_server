import express from 'express'

import {getUser, } from '../controller.js'

import {searchPost} from '../controllers/searchPost.js'



const router = express.Router();


router.post('/users',getUsers)




export default router