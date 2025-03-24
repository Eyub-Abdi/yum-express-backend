// src/schemas/vendorSchema.js
const Joi = require('joi')

const vendorRegistrationSchema = Joi.object({
  first_name: Joi.string().min(3).max(50).required(),
  last_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/) // You can adjust this pattern if needed
    .required(),
  banner: Joi.string().uri().required(), // Assuming the banner is a URL
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  category: Joi.string().valid('restaurant', 'grocery').required(),
  business_name: Joi.string().min(3).max(100).required(), // Added business_name field
  password: Joi.string().min(6).required()
})

module.exports = vendorRegistrationSchema
