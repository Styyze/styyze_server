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
        bio: Joi.string().max(500).optional(),
        
        avatarUrl: Joi.array().items(mediaItemSchema).optional(),
        coverPhotoUrl: Joi.array().items(mediaItemSchema).optional(),
        
        location: Joi.string().max(100).optional(),
        website: Joi.string().uri().optional()
    });
    
    return schema.validate(data);
};