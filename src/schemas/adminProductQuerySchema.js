const Joi = require('joi')

const adminProductQuerySchema = Joi.object({
  search: Joi.string().allow('').optional(),
  vendor_id: Joi.number().integer().min(1).optional(),
  is_active: Joi.string().valid('true', 'false').optional(),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  sort: Joi.string().valid('price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})

module.exports = { adminProductQuerySchema }
