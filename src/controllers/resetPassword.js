const knex = require('../db/knex')
const bcrypt = require('bcrypt')
const Joi = require('joi')

async function resetPassword(req, res) {
  // Joi schema
  const schema = Joi.object({
    token: Joi.string().trim().required(),
    password: Joi.string().min(8).max(100).required()
  })

  // Validate request body
  const { error, value } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { token, password } = value
  // 1. Find valid reset record
  const resetRecord = await knex('password_resets').where({ token, used: false }).andWhere('expires_at', '>', new Date()).first()

  if (!resetRecord) {
    return res.status(400).json({ message: 'Invalid or expired token.' })
  }

  // Map user_type to table name
  const userTables = {
    customer: 'customers',
    vendor: 'vendors',
    admin: 'admins',
    driver: 'drivers'
  }

  const tableName = userTables[resetRecord.user_type]
  if (!tableName) {
    return res.status(400).json({ message: 'Invalid user type.' })
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Update user's password and updated_at timestamp
  await knex(tableName).where({ id: resetRecord.user_id }).update({
    password_hash: hashedPassword,
    updated_at: new Date()
  })
  // Mark token as used
  await knex('password_resets').where({ id: resetRecord.id }).update({ used: true, used_at: new Date() })

  return res.status(200).json({ message: 'Password has been reset successfully.' })
}

module.exports = { resetPassword }
