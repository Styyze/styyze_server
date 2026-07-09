import CustomOrder from '../models/CustomOrder.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const createMeasurementOrder = async (req, res, next) => {
    try {
        const { userHeightCm, userId} = req.body;

        const frontImage = req.files?.front_image?.[0];
        const sideImage = req.files?.side_image?.[0];

        // Validation
        if (!userId || !userHeightCm || !frontImage) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId, userHeightCm, and front_image are mandatory."
            });
        }


        const AI_BASE_URL = 'https://styzze-ai-model.onrender.com';

        // If side image exists, use geometric measurement
        const endpointPath = sideImage 
            ? '/measure/geometric' 
            : '/measure/live';

        const targetEndpoint = `${AI_BASE_URL}${endpointPath}`;

        console.log(`[AI Sync] Target Endpoint: ${targetEndpoint}`);


        // Create multipart form-data for FastAPI
        const form = new FormData();

        form.append(
            "front_image",
            fs.createReadStream(frontImage.path)
        );


        if (sideImage) {
            form.append(
                "side_image",
                fs.createReadStream(sideImage.path)
            );
        }


        form.append(
            "height_cm",
            Number(userHeightCm)
        );


        // Health check
        await axios.get(`${AI_BASE_URL}/health`);


        // Send image files to AI service
        const aiResponse = await axios.post(
            targetEndpoint,
            form,
            {
                headers: {
                    ...form.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000
            }
        );


        console.log("AI Response:", aiResponse.data);


        // Save order
        const newOrder = new CustomOrder({
            userId,
            userHeightCm: Number(userHeightCm),

            // Save local paths temporarily or replace with Cloudinary URLs later
            frontImageUrl: frontImage.path,
            sideImageUrl: sideImage ? sideImage.path : null,

            ai_measurement_data: aiResponse.data,
            status: 'completed'
        });


        const savedOrder = await newOrder.save();


        return res.status(201).json({
            success: true,
            message: `Order analytics generated successfully using ${aiResponse.data.tool} engine.`,
            data: savedOrder
        });


    } catch (error) {

        if (error.response) {

            console.error(
                `[AI Service Error Status]: ${error.response.status}`
            );

            console.error(
                `[AI Service Error Data]:`,
                error.response.data
            );

            return res.status(error.response.status).json({
                success:false,
                message:error.response.data
            });
        }


        console.error(
            "Critical server controller exception:",
            error
        );

        next(error);
    }
};