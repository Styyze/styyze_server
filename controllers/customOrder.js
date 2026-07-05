import CustomOrder from '../models/CustomOrder.js';
import axios from 'axios';

export const createMeasurementOrder = async (req, res, next) => {
    try {
        // FIX 1: Destructure the actual fields the client sent directly at the root of req.body
        const { userHeightCm, frontImageUrl, sideImageUrl } = req.body;
        const userId = req.userId || req.body.userId;

        // 1. Validation check (these variables now properly exist!)
        if (!userId || !userHeightCm || !frontImageUrl) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId, userHeightCm, and frontImageUrl are mandatory."
            });
        }

        const AI_BASE_URL = 'https://styzze-ai-model.onrender.com';
        
        // 2. Select route based on presence of sideImageUrl
        const endpointPath = sideImageUrl ? '/measure/geometric' : '/measure/live';
        const targetEndpoint = `${AI_BASE_URL}${endpointPath}`;

        console.log(`[AI Sync] Target Endpoint determined: ${targetEndpoint}`);

        // FIX 2: Build the cleanly-named payload object for FastAPI Pydantic
        const fastapiPayload = {
            front_image_url: frontImageUrl,
            side_image_url: sideImageUrl || null,
            height_cm: Number(userHeightCm)
        };

        // 4. Send direct JSON data to the AI server
        const aiResponse = await axios.post(targetEndpoint, fastapiPayload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 5. Persist the output payload into your MongoDB/Database
        const newOrder = new CustomOrder({
            userId,
            userHeightCm: Number(userHeightCm),
            frontImageUrl,
            sideImageUrl: sideImageUrl || null,
            ai_measurement_data: aiResponse.data, 
            status: 'completed'
        });

        const savedOrder = await newOrder.save();

        // FIX 3: Look at how your client logs data: response?.data?.data
        // We ensure the returned object wraps the savedOrder properly so the client gets its measurements.
        return res.status(201).json({
            success: true,
            message: `Order analytics generated successfully using the ${aiResponse.data.tool} engine.`,
            data: savedOrder // client reads response.data.data
        });

    } catch (error) {
        if (error.response) {
            console.error(`[AI Service Error Status]: ${error.response.status}`);
            console.error(`[AI Service Error Data]:`, error.response.data);
            return res.status(error.response.status).json({
                success: false,
                message: "The AI Model service failed to compute measurements.",
                detail: error.response.data
            });
        }
        
        console.error("Critical server controller exception:", error);
        next(error); 
    }
};