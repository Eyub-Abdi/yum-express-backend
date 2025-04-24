const Joi = require('joi')

const checkoutSchema = Joi.object({
  cart_id: Joi.number().integer().positive().required().messages({
    'number.base': 'cart_id must be a number',
    'number.integer': 'cart_id must be an integer',
    'number.positive': 'cart_id must be a positive number',
    'any.required': 'cart_id is required for checkout'
  }),

  payment_method: Joi.string().valid('mobile', 'creditcard').required().messages({
    'any.only': 'Payment method must be either "mobile" or "creditcard"',
    'any.required': 'Payment method is required'
  }),

  phone_number: Joi.when('payment_method', {
    is: 'mobile',
    then: Joi.string()
      .pattern(/^255[67][0-9]{8}$/) // Fixed pattern: must start with 255 followed by 9 digits (Tanzanian format)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must start with 255 and be a valid Tanzanian mobile number',
        'any.required': 'Phone number is required for mobile payments'
      }),
    otherwise: Joi.forbidden()
  }),

  card_number: Joi.when('payment_method', {
    is: 'creditcard',
    then: Joi.string().creditCard().required().messages({
      'string.creditCard': 'Card number must be a valid credit card number',
      'any.required': 'Card number is required for credit card payments'
    }),
    otherwise: Joi.forbidden()
  }),

  card_expiry: Joi.when('payment_method', {
    is: 'creditcard',
    then: Joi.string()
      .pattern(/^(0[1-9]|1[0-2])\/\d{2}$/) // MM/YY format
      .required()
      .messages({
        'string.pattern.base': 'Card expiry must be in MM/YY format',
        'any.required': 'Card expiry date is required for credit card payments'
      }),
    otherwise: Joi.forbidden()
  }),

  card_cvc: Joi.when('payment_method', {
    is: 'creditcard',
    then: Joi.string()
      .pattern(/^[0-9]{3,4}$/)
      .required()
      .messages({
        'string.pattern.base': 'CVC must be a 3 or 4 digit number',
        'any.required': 'Card CVC is required for credit card payments'
      }),
    otherwise: Joi.forbidden()
  })
})

module.exports = { checkoutSchema }
