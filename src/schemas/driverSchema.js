const Joi = require('joi')

const driverRegistrationSchema = Joi.object({
  first_name: Joi.string().min(3).max(100).required(),
  last_name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(20).required(),
  vehicle_details: Joi.string().max(255).required(),
  password: Joi.string().min(6).max(100).required()
})

module.exports = { driverRegistrationSchema }
