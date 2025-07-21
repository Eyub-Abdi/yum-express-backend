const Joi = require('joi')

const productSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).required(),
  price: Joi.number().positive().precision(2).required(), // Added price validation
  image_url: Joi.string().max(2000).optional(),
  stock: Joi.number().integer().min(0).max(4000).required(),
  is_desabled: Joi.boolean().default(true)
})

const productUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().precision(2).optional(),
  stock: Joi.number().integer().min(0).max(4000).optional(),
  is_desabled: Joi.boolean().optional(),
  image_url: Joi.string().max(1000).optional() // Allow updating image URL
}).min(1) // Ensure at least one field is provided

const productQuerySchema = Joi.object({
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  sort: Joi.string().valid('price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  in_stock: Joi.string().valid('true', 'false').optional()
})
// Schema to validate publish/unpublish toggle
const publishStatusSchema = Joi.object({
  is_published: Joi.boolean().required()
})
const maxOrderQuantitySchema = Joi.object({
  max_order_quantity: Joi.number().integer().min(1).max(3000).required()
})

module.exports = { productSchema, productUpdateSchema, publishStatusSchema, productQuerySchema, maxOrderQuantitySchema }
