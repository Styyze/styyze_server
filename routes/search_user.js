import express from 'express'


import {user_search} from '../controllers/search_user.js';



const router = express.Router();


router.get('/user/search', user_search);





export default router