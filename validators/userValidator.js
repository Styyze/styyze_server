import Joi from "joi";

export const createUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .trim(),

  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim(),

  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: false } })
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address (e.g., user@example.com).'
    }),

  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long.',
      'string.pattern.base': 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).'
    }),
});