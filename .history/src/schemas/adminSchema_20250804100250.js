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
  password: Joi.string().min(6).max(100).required(),
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

const updateAdminEmailSchema = Joi.object({
  new_email: Joi.string().email().max(255).required()
})

const nameSchema = Joi.object({
  first_name: Joi.string().min(3).max(50).required(),
  last_name: Joi.string().min(3).max(50).required()
})

module.exports = { adminRegistrationSchema, updateAdminSchema, updateAdminEmailSchema, adminLoginSchema, nameSchema }
