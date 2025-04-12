const Joi = require('joi')

// Schema for validating the request body
const activateDeactivateVendorSchema = Joi.object({
  active: Joi.boolean().required() // expecting `active: true` or `active: false`
})

module.exports = { activateDeactivateVendorSchema }
