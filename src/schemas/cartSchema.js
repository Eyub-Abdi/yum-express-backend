const Joi = require('joi')

const cartSchema = Joi.object({
  customer_id: Joi.number().integer().optional(), // customer_id should be an integer, optional for guests
  session_token: Joi.string().max(255).optional(), // session_token should be a string, optional for authenticated users
  expires_at: Joi.date().optional() // Ensure expires_at is a valid date
}).or('customer_id', 'session_token') // Ensure that at least one of customer_id or session_token is provided

module.exports = cartSchema
