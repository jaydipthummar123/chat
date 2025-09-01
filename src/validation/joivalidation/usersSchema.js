import Joi from "joi";

  export const userSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z\s]+$/)
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.base": "Name must be a string",
      "string.empty": "Name is required",
      "string.min": "Name must be at least 3 characters long",
      "string.max": "Name must not exceed 100 characters",
      "string.pattern.base": "Name must only contain letters and spaces",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.max": "Password must not exceed 30 characters",
      "any.required": "Password is required",
    }),
});
