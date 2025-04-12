const Joi = require('joi')

const adminVendorQuerySchema = Joi.object({
  search: Joi.string().optional(),
  verified: Joi.string().valid('true', 'false').optional(),
  active: Joi.string().valid('true', 'false').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})

module.exports = { adminVendorQuerySchema }
