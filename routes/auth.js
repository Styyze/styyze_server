import express from 'express'

import {register,users,login} from '../controllers/auth.js'
import {post} from '../controllers/posts.js'
import {searchPost} from '../controllers/searchPost.js'



const router = express.Router();

router.post('/', register);
router.post('/sign_up', users);
router.post('/login', login)
router.post('/posts', post)
router.get('/search', searchPost)





export default router