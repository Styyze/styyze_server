import express from 'express'
import { protect } from '../middleware/auth.js';

import {createProject, getHouseProjects } from '../controllers/project.js';

const router = express.Router();


router.post('/projects', protect, createProject);
router.get('/get/house/projects', getHouseProjects);

export default router