import express from 'express'

import {register,users} from '../controllers/auth.js'
import {post} from '../controllers/posts.js'
import {login} from '../controllers/login.js'

import {searchPost} from '../controllers/searchPost.js'



const router = express.Router();

router.post('/', login);
router.post('/sign_up', users);
router.post('/posts', post)
router.get('/search', searchPost)





export default router