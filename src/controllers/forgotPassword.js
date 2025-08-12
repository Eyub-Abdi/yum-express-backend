const knex = require('../db/knex')
const { sendEmail } = require('../services/emailService')
const { generateSessionToken } = require('../utils/generateSessionToken')
const forgotPasswordSchema = require('../schemas/forgotPasswordSchema')
const config = require('../../config/default')

async function forgotPassword(req, res) {
  // Validate request body
  const { error, value } = forgotPasswordSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { email, user_type } = value

  // Map user_type to table name
  const userTables = {
    customer: 'customers',
    vendor: 'vendors',
    admin: 'admins',
    driver: 'drivers'
  }

  const tableName = userTables[user_type]
  if (!tableName) {
    return res.status(400).json({ message: 'Invalid user type.' })
  }

  // Find user only in the specified table
  const user = await knex(tableName).where({ email }).first()

  // Always respond with success (security)
  if (!user) {
    return res.status(200).json({ message: 'If your email exists, you will receive a password reset link shortly.' })
  }

  // Generate token and expiry (1 hour)
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  // Save reset record
  await knex('password_resets').insert({
    user_id: user.id,
    user_type,
    token,
    expires_at: expiresAt,
    used: false
  })

  // Send reset email using your email service
  await sendEmail({
    recipientEmail: email,
    firstName: user.first_name || 'User',
    type: 'passwordReset',
    payload: { token }
  })

  return res.status(200).json({ message: 'If your email exists, you will receive a password reset link shortly.' })
}

module.exports = { forgotPassword }
