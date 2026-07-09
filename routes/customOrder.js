import express from 'express';
import { createMeasurementOrder } from '../controllers/customOrder.js';
import multer from "multer";

const router = express.Router();


const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }

});


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
            name:"front_image",
            maxCount:1
        },
        {
            name:"side_image",
            maxCount:1
        }
    ]),
    createMeasurementOrder
);


export default router;