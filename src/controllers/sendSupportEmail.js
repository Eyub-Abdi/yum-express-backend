const Joi = require('joi')
const { sendEmail } = require('../services/emailService')

const supportSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(7)
    .required(),
  subject: Joi.string().required(),
  message: Joi.string().min(10).required()
})

exports.sendSupportEmail = async (req, res) => {
  const { error, value } = supportSchema.validate(req.body)

  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { name, email, phone, subject, message } = value
  name.toUpperCase()
  try {
    await sendEmail({
      recipientEmail: 'yumexpreess@gmail.com',
      firstName: name,
      type: 'support',
      payload: { email, phone, subject, message }
    })

    return res.status(200).json({ success: true, message: 'Support email sent' })
  } catch (error) {
    console.error('Error sending support email:', error)
    return res.status(500).json({ error: 'Failed to send support email' })
  }
}
