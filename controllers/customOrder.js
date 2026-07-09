import CustomOrder from '../models/CustomOrder.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import sharp from 'sharp';

export const createMeasurementOrder = async (req, res, next) => {
    try {
        const { userHeightCm, userId} = req.body;

        const frontImage = req.files?.front_image?.[0];
        const sideImage = req.files?.side_image?.[0];
        console.log("Front Image Details:");
        console.log({
            filename: frontImage?.originalname,
            mimetype: frontImage?.mimetype,
        });

        console.log("Side Image Details:");
        console.log({
            filename: sideImage?.originalname,
            mimetype: sideImage?.mimetype,
        });

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

        // 1. Optimize front image buffer
        const frontImageBuffer = await sharp(frontImage.buffer)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 }) 
            .toBuffer();

        form.append("front_image", frontImageBuffer, {
            filename: 'front_image.jpg',
            contentType: 'image/jpeg'
        });

        // 2. Optimize side image buffer if it exists
        if (sideImage) {
            const sideImageBuffer = await sharp(sideImage.buffer)
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();

            form.append("side_image", sideImageBuffer, {
                filename: 'side_image.jpg',
                contentType: 'image/jpeg'
            });
        }
        
        form.append("height_cm", String(userHeightCm));

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

        // --- Hardcoded Testing Configuration ---
        const fakeFrontImageUrl = "https://via.placeholder.com/1024x1024.png?text=Mock+Front+Image";
        const fakeSideImageUrl = sideImage ? "https://via.placeholder.com/1024x1024.png?text=Mock+Side+Image" : null;

        // Save order structure to MongoDB
        const newOrder = new CustomOrder({
            userId: userId,
            userHeightCm: Number(userHeightCm),
            frontImageUrl: fakeFrontImageUrl, // matched schema key
            sideImageUrl: fakeSideImageUrl,   // matched schema key
            status: "completed",              // matched enum choices ('pending', 'processing', 'completed', 'failed')
            
            // Nested object properties bundled exactly like the schema definition
            ai_measurement_data: {
                tool: aiResponse.data.tool,
                status: aiResponse.data.status,
                unit: aiResponse.data.unit || 'cm',
                warnings: aiResponse.data.warnings || [],
                measurements: {
                    height: aiResponse.data.measurements?.height,
                    shoulder_width: aiResponse.data.measurements?.shoulder_width,
                    chest_width: aiResponse.data.measurements?.chest_width,
                    chest_circumference: aiResponse.data.measurements?.chest_circumference,
                    waist_width: aiResponse.data.measurements?.waist_width,
                    waist: aiResponse.data.measurements?.waist,
                    hip_width: aiResponse.data.measurements?.hip_width,
                    hip: aiResponse.data.measurements?.hip,
                    neck_width: aiResponse.data.measurements?.neck_width || null, // Safety default mapping
                    neck: aiResponse.data.measurements?.neck,
                    arm_length: aiResponse.data.measurements?.arm_length,
                    sleeve_length: aiResponse.data.measurements?.sleeve_length,
                    inseam: aiResponse.data.measurements?.inseam,
                    outseam: aiResponse.data.measurements?.outseam,
                    thigh: aiResponse.data.measurements?.thigh,
                    calf: aiResponse.data.measurements?.calf,
                    ankle: aiResponse.data.measurements?.ankle
                },
                metadata: {
                    front_image_size: aiResponse.data.metadata?.front_image_size,
                    side_image_size: aiResponse.data.metadata?.side_image_size,
                    tailor_measurement_sets: aiResponse.data.metadata?.tailor_measurement_sets
                }
            }
        });

        const savedOrder = await newOrder.save();
        // ----------------------------------------

        return res.status(201).json({
            success: true,
            message: `Order analytics generated successfully using ${aiResponse.data.tool} engine.`,
            data: savedOrder
        });

    } catch (error) {
        if (error.response) {
            console.error(`[AI Service Error Status]: ${error.response.status}`);
            console.error(`[AI Service Error Data]:`, error.response.data);

            return res.status(error.response.status).json({
                success: false,
                message: error.response.data
            });
        }

        console.error("Critical server controller exception:", error);
        next(error);
    }
};