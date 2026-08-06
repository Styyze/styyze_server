import Joi from "joi";

export const createUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required(),

  name: Joi.string()
    .min(2)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(8)
    .required(),
});