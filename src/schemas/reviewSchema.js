const Joi = require('joi')

const reviewSchema = Joi.object({
  customer_id: Joi.number().required(),
  vendor_id: Joi.number().required(),
  rating: Joi.number().min(1).max(5).required(), // rating should be between 1 and 5
  comment: Joi.string().max(500).optional() // Optional comment, max 500 characters
})
module.exports = reviewSchema
