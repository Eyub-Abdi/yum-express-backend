const Joi = require('joi')

const driverRegistrationSchema = Joi.object({
  first_name: Joi.string().min(3).max(100).required(),
  last_name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(20).required(),
  vehicle_details: Joi.string().max(255).required()
})

const driverQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null).default(''),
  sort_by: Joi.string().valid('first_name', 'last_name', 'email', 'phone', 'created_at', 'updated_at').default('created_at'),
  order: Joi.string().valid('asc', 'desc').default('desc')
})

const driverUpdateSchema = Joi.object({
  first_name: Joi.string().max(50),
  last_name: Joi.string().max(50),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,14}$/),
  vehicle_details: Joi.string(),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  is_active: Joi.boolean()
})
module.exports = { driverRegistrationSchema, driverQuerySchema, driverUpdateSchema }
