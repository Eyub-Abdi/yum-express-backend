const Joi = require('joi')

const assignDriverSchema = Joi.object({
  order_id: Joi.number().integer().positive().required(),
  driver_id: Joi.number().integer().positive().required()
})

module.exports = { assignDriverSchema }
