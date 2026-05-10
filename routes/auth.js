import express from 'express'

import {createUser, login, UserLogin, reloadSession, logout } from '../controllers/auth.js'
import {post} from '../controllers/posts.js'

import {searchPost} from '../controllers/searchPost.js'



const router = express.Router();

router.post('/login', login); 
router.post('/sign_up', createUser); 
router.post('/posts', post);
router.post('/userLogin',UserLogin)
router.post('/refresh_token', post);
router.get("/reload", reloadSession );
router.post("/logout", logout);





export default router