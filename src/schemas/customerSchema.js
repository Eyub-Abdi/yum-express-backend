// src/schemas/customerSchema.js
const Joi = require('joi')

const customerRegistrationSchema = Joi.object({
  first_name: Joi.string().min(3).max(50).required(),
  last_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(), // Example for a 10-digit phone number
  password: Joi.string().min(6).required()
})

module.exports = customerRegistrationSchema
