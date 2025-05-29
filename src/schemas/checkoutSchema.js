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

  cardholder_name: Joi.when('payment_method', {
    is: 'creditcard',
    then: Joi.string().min(3).max(50).required().messages({
      'string.base': 'Cardholder name must be a string',
      'string.empty': 'Cardholder name cannot be empty',
      'any.required': 'Cardholder name is required for credit card payments'
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
  }),

  // Delivery info
  delivery_phone: Joi.string()
    .pattern(/^255[67][0-9]{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Delivery phone must be a valid Tanzanian number starting with 255',
      'any.required': 'Delivery phone is required'
    }),

  address: Joi.string().min(3).max(255).required().messages({
    'string.base': 'Address must be a string',
    'string.empty': 'Address cannot be empty',
    'string.min': 'Address must be at least 3 characters',
    'any.required': 'Address is required'
  }),

  street_name: Joi.string().min(3).max(255).required().messages({
    'string.base': 'Street name must be a string',
    'string.empty': 'Street name cannot be empty',
    'string.min': 'Street name must be at least 3 characters',
    'any.required': 'Street name is required'
  }),

  delivery_notes: Joi.string().allow('').max(500).optional().messages({
    'string.base': 'Delivery notes must be a string',
    'string.max': 'Delivery notes must be less than 500 characters'
  }),

  lat: Joi.number().min(-90).max(90).required().messages({
    'number.base': 'Latitude must be a number',
    'number.min': 'Latitude must be >= -90',
    'number.max': 'Latitude must be <= 90',
    'any.required': 'Latitude is required'
  }),

  lng: Joi.number().min(-180).max(180).required().messages({
    'number.base': 'Longitude must be a number',
    'number.min': 'Longitude must be >= -180',
    'number.max': 'Longitude must be <= 180',
    'any.required': 'Longitude is required'
  })
})

module.exports = { checkoutSchema }
