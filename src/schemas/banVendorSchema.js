const Joi = require('joi')

const banVendorSchema = Joi.object({
  ban: Joi.boolean().required()
  //   reason: Joi.string().min(3).max(255).required() IF WE NEED IT IN THE FUTURE WILL ENABLE IT FOR NOW BAN IS JUST ENOUGH.
})
module.exports = { banVendorSchema }
