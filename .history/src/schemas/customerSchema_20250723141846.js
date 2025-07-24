// src/schemas/customerSchema.js
const Joi = require('joi')

const customerRegistrationSchema = Joi.object({
  first_name: Joi.string().min(3).max(50).required(),
  last_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^255\d{9}$/) // starts with 255, followed by exactly 9 digits
    .required(),
  password: Joi.string().min(6).required()
})

const customerUpdateSchema = Joi.object({
  first_name: Joi.string().min(3).max(50),
  last_name: Joi.string().min(3).max(50),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9]{10}$/) // 10-digit phone number
})

const customerNameSchema = Joi.object({
  first_name: Joi.string().trim().min(3).max(50).required(),
  last_name: Joi.string().trim().min(3).max(50).required()
})

const passwordUpdateSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(6).required()
})

const phoneUpdateSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[1-9]\d{7,14}$/) // 8 to 15 digits, no '+' allowed, starts with 1–9
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid international format without + (e.g., 255712345678)',
      'string.empty': 'Phone number is required'
    })
})

const customerEmailUpdateSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  })
})

module.exports = { customerRegistrationSchema, customerUpdateSchema, passwordUpdateSchema, customerNameSchema, phoneUpdateSchema, customerEmailUpdateSchema }
