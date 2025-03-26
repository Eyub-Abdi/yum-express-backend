// src/schemas/updatePasswordSchema.js
const Joi = require('joi')

const updatePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(6).required()
})

module.exports = updatePasswordSchema
