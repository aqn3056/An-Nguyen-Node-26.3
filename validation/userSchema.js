const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  name: Joi.string().trim().min(3).max(30).required(),
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,30}$/,
      "strong password",
    )
    .required()
    .messages({
      "string.pattern.name":
        "password must be 8 to 30 characters and include an uppercase letter, a lowercase letter, a number, and a special character",
    }),
});

module.exports = { userSchema };
