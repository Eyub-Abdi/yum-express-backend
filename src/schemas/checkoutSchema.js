const Joi = require('joi')

const checkoutSchema = Joi.object({
  cart_id: Joi.number().integer().positive().required().messages({
    'number.base': 'cart_id must be a number',
    'number.integer': 'cart_id must be an integer',
    'number.positive': 'cart_id must be a positive number',
    'any.required': 'cart_id is required for checkout'
  })
})

module.exports = { checkoutSchema }
