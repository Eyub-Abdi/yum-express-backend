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
  address: Joi.string().min(3).max(100).required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  category: Joi.string().valid('restaurant', 'grocery').required(),
  business_name: Joi.string().min(3).max(100).required(), // Added business_name field
  password: Joi.string().min(6).required()
})

// vendorUpdateSchema.js
const vendorUpdateSchema = Joi.object({
  first_name: Joi.string().min(3).max(50),
  last_name: Joi.string().min(3).max(50),
  phone: Joi.string().pattern(/^[0-9]{10}$/), // You can adjust this pattern if needed
  banner: Joi.string().uri(), // Assuming the banner is a URL
  address: Joi.string().min(3).max(100),
  latitude: Joi.number(),
  longitude: Joi.number(),
  category: Joi.string().valid('restaurant', 'grocery'),
  business_name: Joi.string().min(3).max(100)
})

const vendorEmailUpdateSchema = Joi.object({
  email: Joi.string().email().required() // Ensures the email field is provided
})

module.exports = { vendorRegistrationSchema, vendorUpdateSchema, vendorEmailUpdateSchema }
