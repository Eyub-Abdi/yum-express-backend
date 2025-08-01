const Joi = require('joi')

const getVendorOrdersSchema = Joi.object({
  status: Joi.string().valid('processing', 'on-the-way', 'delivered', 'canceled').optional(),
  start_date: Joi.date().iso().optional(), // ISO 8601 date format (e.g., 2025-04-01)
  end_date: Joi.date().iso().optional(), // ISO 8601 date format (e.g., 2025-04-30)
  product_name: Joi.string().optional(), // Product name can be any string
  customer_name: Joi.string().optional() // Customer name can be any string
}).with('start_date', 'end_date') // If start_date is provided, end_date should be present too

const updateVendorOrderStatusSchema = Joi.object({
  order_id: Joi.number().positive().required(),
  status: Joi.string().valid('processing', 'on-the-way', 'delivered').required()

  // tracking_number: Joi.string().optional()
})

// Schema to validate the rejection reason
const rejectSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(255).required()
})

module.exports = {
  getVendorOrdersSchema,
  rejectSchema,
  updateVendorOrderStatusSchema
}
