// src/schemas/vendorSchema.js
const Joi = require('joi')

const vendorRegistrationSchema = Joi.object({
  first_name: Joi.string().min(3).max(50).required(),
  last_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^(?:[1-9][0-9]{9,11}|0[0-9]{9})$/)
    .required(),

  is_active: Joi.boolean(),
  banner: Joi.string().required(), // Assuming the banner is a URL
  address: Joi.string().min(3).max(100).required(),
  // latitude: Joi.number().optional(),
  // longitude: Joi.number().optional(),
  category: Joi.string().valid('Restaurant', 'Grocery').required(),
  business_name: Joi.string().min(3).max(100).required() // Added business_name field
  // password: Joi.string().min(6).required()
})

// vendorUpdateSchema.js
const vendorUpdateSchema = Joi.object({
  first_name: Joi.string().min(3).max(50),
  last_name: Joi.string().min(3).max(50),
  phone: Joi.string().pattern(/^(?:[1-9][0-9]{9,11}|0[0-9]{9})$/), // You can adjust this pattern if needed
  banner: Joi.string(), // Assuming the banner is a URL
  address: Joi.string().min(3).max(100),
  // latitude: Joi.number(),
  // longitude: Joi.number(),
  is_active: Joi.boolean(),
  email: Joi.string().email(),
  category: Joi.string().valid('Restaurant', 'Grocery'),
  business_name: Joi.string().min(3).max(100)
})

const vendorEmailUpdateSchema = Joi.object({
  email: Joi.string().email().required() // Ensures the email field is provided
})

// src/schemas/vendorLocationSchema.js

const vendorLocationSchema = Joi.object({
  lat: Joi.number().required().min(-90).max(90).message('Latitude must be between -90 and 90'),
  lng: Joi.number().required().min(-180).max(180).message('Longitude must be between -180 and 180'),
  category: Joi.string().valid('restaurant', 'grocery').optional()
})

module.exports = { vendorRegistrationSchema, vendorUpdateSchema, vendorEmailUpdateSchema, vendorLocationSchema }
