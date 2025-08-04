// schemas/adminSchema.js
const Joi = require('joi')

const adminRegistrationSchema = Joi.object({
  first_name: Joi.string().min(3).max(50).required(),
  last_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().max(255).required(),
  phone: Joi.string()
    .pattern(/^[\d+()-\s]+$/)
    .min(10)
    .max(20)
    .required(),
  role: Joi.string().valid('admin', 'superadmin').optional()
})

const adminLoginSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().max(100).required()
})

const updateAdminSchema = Joi.object({
  first_name: Joi.string().min(3).max(100).optional(),
  last_name: Joi.string().min(3).max(100).optional(),
  phone: Joi.string()
    .pattern(/^[\d+()-\s]+$/)
    .min(10)
    .max(20)
    .optional(),
  role: Joi.string().valid('admin', 'superadmin').optional(),
  is_active: Joi.boolean().optional()
}).min(1) // Ensures that at least one field must be provided

const adminEmailUpdateSchema = Joi.object({
  email: Joi.string().email().max(255).required()
})

const nameSchema = Joi.object({
  first_name: Joi.string().min(3).max(50).required(),
  last_name: Joi.string().min(3).max(50).required()
})
const phoneUpdateSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^255\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must start with 255 followed by 9 digits',
      'string.empty': 'Phone number is required'
    })
})
module.exports = { adminRegistrationSchema, updateAdminSchema, adminEmailUpdateSchema, adminLoginSchema, nameSchema, phoneUpdateSchema }
