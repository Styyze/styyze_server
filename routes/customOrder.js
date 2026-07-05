import express from 'express'

import {createMeasurementOrder} from '../controllers/customOrder.js'


const router = express.Router();

router.post('/create_measurement', createMeasurementOrder); 


console.log('received image!')
export default router