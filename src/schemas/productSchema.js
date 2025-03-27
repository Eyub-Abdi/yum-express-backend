const Joi = require('joi')

const productSchema = Joi.object({
  vendor_id: Joi.number().integer().required(), // Ensure vendor_id is present
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).required(),
  price: Joi.number().positive().precision(2).required(), // Added price validation
  image_url: Joi.string().uri().optional(), // Added image_url validation
  stock: Joi.number().integer().min(0).required(),
  is_available: Joi.boolean().default(true)
})

const productUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().precision(2).optional(),
  stock: Joi.number().integer().min(0).optional(),
  is_available: Joi.boolean().optional(),
  image_url: Joi.string().uri().optional() // Allow updating image URL
}).min(1) // Ensure at least one field is provided

module.exports = { productSchema, productUpdateSchema }
