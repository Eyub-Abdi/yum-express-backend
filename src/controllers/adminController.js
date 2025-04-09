// controllers/adminController.js
const knex = require('../db/knex')
const bcrypt = require('bcrypt')
const { adminRegistrationSchema } = require('../schemas/adminSchema')
const { generateVerificationToken, generateVerificationTokenExpiry } = require('../services/tokenService')
const { verifyEmail } = require('../services/emailVerificationService')
const { sendVerificationEmail } = require('../services/emailService')

const registerAdmin = async (req, res) => {
  const { error, value } = adminRegistrationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { first_name, last_name, email, phone, password, role } = value

  const existing = await knex('admins').where({ email }).first()
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const verification_token = generateVerificationToken()
  const verification_token_expiry = generateVerificationTokenExpiry(48)

  await knex('admins').insert({
    first_name,
    last_name,
    email,
    phone,
    password_hash: hashedPassword,
    role: role || 'admin',
    verified: false,
    verification_token,
    verification_token_expiry
  })

  // Send verification email
  await sendVerificationEmail(email, first_name, verification_token, 'admins')

  res.status(201).json({ message: 'Admin registered successfully. Please verify your email.' })
}

const verifyAdminEmail = async (req, res) => {
  await verifyEmail('admins', req, res)
}

module.exports = { registerAdmin, verifyAdminEmail }
