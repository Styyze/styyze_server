import express from 'express'

import {createMeasurementOrder} from '../controllers/CustomOrder.js'



const router = express.Router();


router.post('/create_measurement',  createMeasurementOrder); 



export default router