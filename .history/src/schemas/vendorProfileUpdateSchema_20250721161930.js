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
    .pattern(/^255\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must start with 255 followed by 9 digits',
      'string.empty': 'Phone number is required'
    })
})

const addressUpdateSchema = Joi.object({
  address: Joi.string().min(3).max(1000).required().messages({
    'string.empty': 'Address is required'
  })
})

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/ // Matches "HH:mm"

const daySchema = Joi.object({
  is_closed: Joi.boolean().required(),
  open_time: Joi.string().pattern(timePattern).when('is_closed', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  close_time: Joi.string().pattern(timePattern).when('is_closed', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
})

const businessHoursSchema = Joi.object({
  weekdays: daySchema,
  saturday: daySchema,
  sunday: daySchema
}).xor('weekdays', 'saturday', 'sunday') // Only one allowed at a time

module.exports = {
  nameUpdateSchema,
  businessNameSchema,
  emailUpdateSchema,
  phoneUpdateSchema,
  businessHoursSchema,
  addressUpdateSchema
}
