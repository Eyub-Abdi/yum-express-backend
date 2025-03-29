const Joi = require('joi')

const reviewSchema = Joi.object({
  vendor_id: Joi.number().required(),
  rating: Joi.number().min(1).max(5).required(), // rating should be between 1 and 5
  comment: Joi.string().max(500).optional() // Optional comment, max 500 characters
})

const reviewUpdateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(), // Rating between 1-5
  comment: Joi.string().trim().min(3).max(500).optional() // Comment with reasonable length
}).or('rating', 'comment') // At least one field must be provided

module.exports = { reviewSchema, reviewUpdateSchema }
