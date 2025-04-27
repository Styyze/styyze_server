import Joi from "joi";

export const validateUpdateInput = (data) => {
    const schema = Joi.object({
        userId: Joi.string().required(), 
        name: Joi.string().max(100).optional(),
        username: Joi.string().alphanum().min(3).max(30).optional(),
        bio: Joi.string().max(500).optional(),
        avatarUrl: Joi.string().uri().optional(),
        coverPhotoUrl: Joi.string().uri().optional(),
        location: Joi.string().max(100).optional(),
        website: Joi.string().uri().optional()
    });
    return schema.validate(data);
};
