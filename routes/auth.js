import express from 'express'

import {register,createUser, login, AdminLogin} from '../controllers/auth.js'
import {post} from '../controllers/posts.js'

import {searchPost} from '../controllers/searchPost.js'



const router = express.Router();

router.post('/login', login); 
router.post('/sign_up', createUser); 
router.post('/posts', post);
router.post('/adminLogin',AdminLogin)




export default router