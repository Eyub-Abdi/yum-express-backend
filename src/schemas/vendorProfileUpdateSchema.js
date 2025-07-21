const Joi = require('joi')

const nameUpdateSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required()
})

const businessNameSchema = Joi.object({
  business_name: Joi.string().min(2).max(100).required()
})

const emailUpdateSchema = Joi.object({
  email: Joi.string().email().required(),
  verificationCode: Joi.string().length(6).required()
})

const phoneUpdateSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^255\d{9}$/) // Example for Tanzania format
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in +255 format with 9 digits after',
      'string.empty': 'Phone number is required'
    })
})

const addressUpdateSchema = Joi.object({
  address: Joi.string().min(3).max(1000).required().messages({
    'string.empty': 'Address is required'
  })
})

module.exports = {
  nameUpdateSchema,
  businessNameSchema,
  emailUpdateSchema,
  phoneUpdateSchema,
  addressUpdateSchema
}
