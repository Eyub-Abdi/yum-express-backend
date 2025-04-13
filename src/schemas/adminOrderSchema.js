const Joi = require('joi')

const getAllOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),

  customer_id: Joi.number().min(1).optional(),
  vendor_id: Joi.number().min(1).optional(),

  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),

  sort_by: Joi.string().valid('created_at', 'total_amount').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
})

module.exports = { getAllOrdersQuerySchema }
