import express from 'express'

import {getUserMessagesById} from '../controllers/getMessagesById.js';
import { sendMessage, getOrCreateConversation } from '../controllers/message.js';

const router = express.Router();


router.post('/', sendMessage);
router.get('/user/:conversationId', getUserMessagesById);
router.post('/user/conversation',getOrCreateConversation);


export default router