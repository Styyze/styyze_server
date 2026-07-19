import express from 'express'
import { protect } from '../middleware/auth.js';

import {createProject } from '../controllers/project.js';

const router = express.Router();


router.post('/projects', protect, createProject);

export default router