import express from 'express'
import { protect } from '../middleware/auth.js';

import {createProject, getHouseProjects, getProjectById, getCustomerProjects} from '../controllers/project.js';

const router = express.Router();


router.post('/projects', protect, createProject);
router.get('/get/house/projects', protect, getHouseProjects);
router.get("/projects/:projectId", protect, getProjectById);
router.get("/projects", protect, getCustomerProjects);


export default router