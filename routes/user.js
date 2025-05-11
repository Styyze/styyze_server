import express from 'express'

import {getUsers, } from '../controllers/users.js';

import {searchPost} from '../controllers/searchPost.js'



const router = express.Router();


router.get('/users',getUsers)




export default router