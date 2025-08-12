const Joi = require('joi')

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  user_type: Joi.string().valid('customer', 'vendor', 'admin', 'driver').required()
})

module.exports = forgotPasswordSchema
