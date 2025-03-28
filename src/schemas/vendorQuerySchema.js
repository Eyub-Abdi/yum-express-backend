const Joi = require('joi')

const vendorQuerySchema = Joi.object({
  category: Joi.string().valid('restaurant', 'grocery').optional(),
  sortBy: Joi.string().valid('business_name', 'address').default('business_name'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})

// Add the validation function inside the schema itself
vendorQuerySchema.validateQuery = query => {
  const { error, value } = vendorQuerySchema.validate(query)
  if (error) {
    return { isValid: false, message: error.details[0].message }
  }
  return { isValid: true, value }
}

module.exports = vendorQuerySchema
