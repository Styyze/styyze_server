import CustomOrder from '../models/CustomOrder.js';
import axios from 'axios';

import FormData from 'form-data'; 

export const createMeasurementOrder = async (req, res, next) => {
    try {
        const { userHeightCm, frontImageUrl, sideImageUrl } = req.body;
        const userId = req.userId || req.body.userId;

        if (!userId || !userHeightCm || !frontImageUrl) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId, userHeightCm, and frontImageUrl are mandatory."
            });
        }

        const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
        
        
        const endpointPath = sideImageUrl ? '/measure/geometric' : '/measure/live';
        const targetEndpoint = `${AI_BASE_URL}${endpointPath}`;

        console.log(`[AI Sync] Target Endpoint determined: ${targetEndpoint}`);

        const frontImageRes = await axios.get(frontImageUrl, { responseType: 'arraybuffer' });
        
        const formData = new FormData();
        formData.append('front_image', Buffer.from(frontImageRes.data), 'front_input.jpg');
        formData.append('height_cm', userHeightCm.toString());

        if (sideImageUrl) {
            const sideImageRes = await axios.get(sideImageUrl, { responseType: 'arraybuffer' });
            formData.append('side_image', Buffer.from(sideImageRes.data), 'side_input.jpg');
        }

        const aiResponse = await axios.post(targetEndpoint, formData, {
            headers: {
                ...formData.getHeaders() 
            }
        });

        
        const newOrder = new Order({
            userId,
            userHeightCm: Number(userHeightCm),
            frontImageUrl,
            sideImageUrl: sideImageUrl || null,
            ai_measurement_data: aiResponse.data, 
            status: 'completed'
        });

        const savedOrder = await newOrder.save();

        return res.status(201).json({
            success: true,
            message: `Order analytics generated successfully using the ${aiResponse.data.tool} engine.`,
            order: savedOrder
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