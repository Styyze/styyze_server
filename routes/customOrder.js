import express from 'express'

import {createMeasurementOrder} from '../controllers/customOrder.js'

import multer from "multer";

const router = express.Router();


const upload = multer({
    dest: "uploads/"
});

router.post('/create_measurement',upload.fields([
        {
            name:"front_image",
            maxCount:1
        },
        {
            name:"side_image",
            maxCount:1
        }
    ]), createMeasurementOrder); 


console.log('received image!')
export default router