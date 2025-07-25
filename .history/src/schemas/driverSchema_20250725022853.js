const Joi = require('joi')

const driverRegistrationSchema = Joi.object({
  first_name: Joi.string().min(3).max(100).required(),
  last_name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^255\d{9}$/)
    .required(),
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
  phone: Joi.string().pattern(/^255\d{9}$/),
  vehicle_details: Joi.string()
})
module.exports = { driverRegistrationSchema, driverQuerySchema, driverUpdateSchema }
