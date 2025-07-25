// controllers/adminController.js
const knex = require('../db/knex')
const bcrypt = require('bcrypt')
const { adminRegistrationSchema, updateAdminSchema } = require('../schemas/adminSchema')
const updatePasswordSchema = require('../schemas/updatePasswordSchema')

const { validateId } = require('../utils/validateId')

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

const getAllAdmins = async (req, res) => {
  const admins = await knex('admins').select('id', 'first_name', 'last_name', 'email', 'phone', 'role', 'is_active', 'verified', 'last_login', 'created_at').orderBy('created_at', 'desc')

  res.json({ admins })
}

const getAdminById = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid admin ID' })
  }

  const admin = await knex('admins').select('id', 'first_name', 'last_name', 'email', 'phone', 'role', 'is_active', 'verified', 'last_login', 'created_at').where({ id }).first()

  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' })
  }

  res.json(admin)
}

const getAdminProfile = async (req, res) => {
  // Fetch the admin profile from the database using the authenticated admin's ID
  const { id } = req.user // this comes from the authenticateUser middleware

  // Get the admin details from the database
  const admin = await knex('admins').where({ id }).first()

  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' })
  }

  // Return the admin's profile (excluding sensitive fields like password)
  const { password_hash, verification_token, verification_token_expiry, ...adminProfile } = admin
  res.json({ admin: adminProfile })
}

const updateAdmin = async (req, res) => {
  const { error, value } = updateAdminSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { id } = req.params

  // Validate if the id is a valid number
  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid admin ID' })
  }

  const { first_name, last_name, phone, role, is_active } = value

  // Ensure admin exists
  const admin = await knex('admins').where({ id }).first()
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' })
  }

  // Update the admin details
  const updatedAdmin = await knex('admins').where({ id }).update({
    first_name,
    last_name,
    phone,
    role,
    is_active,
    updated_at: knex.fn.now()
  })

  if (!updatedAdmin) {
    return res.status(400).json({ error: 'Failed to update admin' })
  }

  // Return the updated admin details (excluding sensitive fields)
  const adminDetails = await knex('admins').where({ id }).first()
  const { password_hash, verification_token, verification_token_expiry, ...adminProfile } = adminDetails

  res.json({ message: 'Admin updated successfully', admin: adminProfile })
}

const deleteAdmin = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid admin ID' })
  }

  const admin = await knex('admins').where({ id }).first()

  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' })
  }

  await knex('admins').where({ id }).del()

  res.json({ message: 'Admin deleted successfully' })
}

const updateAdminPassword = async (req, res) => {
  const { error } = updatePasswordSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { old_password, new_password } = req.body
  const { id } = req.user

  const admin = await knex('admins').where({ id }).first()
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' })
  }

  const isPasswordValid = await bcrypt.compare(old_password, admin.password_hash)
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Old password is incorrect' })
  }

  const hashedPassword = await bcrypt.hash(new_password, 10)

  await knex('admins').where({ id }).update({ password_hash: hashedPassword, updated_at: knex.fn.now() })

  res.json({ message: 'Password updated successfully' })
}

const verifyAdminEmail = async (req, res) => {
  await verifyEmail('admins', req, res)
}

module.exports = { registerAdmin, getAllAdmins, getAdminById, getAdminProfile, updateAdmin, deleteAdmin, updateAdminPassword, verifyAdminEmail }
