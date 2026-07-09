import express from 'express';
import { createMeasurementOrder } from '../controllers/customOrder.js';
import multer from "multer";

const router = express.Router();

// 1. Switch to memory storage so req.files contains the file buffers 
// needed by your current controller setup.
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: function(req, file, cb){
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if(allowedTypes.includes(file.mimetype)){
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG and WEBP images are allowed"));
        }
    }
});

router.post(
    '/create_measurement',
    upload.fields([
        {
            name: "front_image",
            maxCount: 1
        },
        {
            name: "side_image",
            maxCount: 1
        }
    ]),
    createMeasurementOrder
);

export default router;