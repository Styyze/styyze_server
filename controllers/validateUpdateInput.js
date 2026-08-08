import Joi from "joi";

export const validateUpdateInput = (data) => {
    const mediaItemSchema = Joi.object({
        mediaUrl: Joi.string().uri().optional(),
        mediaId: Joi.string().optional()
    });

    const schema = Joi.object({
        userId: Joi.string().required(), 
        name: Joi.string().max(100).optional(),
        username: Joi.string().alphanum().min(3).max(30).optional(),
        
        // Add bio here!
        bio: Joi.string().max(500).allow('').optional(),
        
        avatarUrl: Joi.array().items(mediaItemSchema).optional(),
        coverPhotoUrl: Joi.array().items(mediaItemSchema).optional(),
        
        location: Joi.string().max(100).allow('').optional(),
        website: Joi.string().uri().allow('').optional()
    });
    
    return schema.validate(data);
};