const knex = require('../db/knex')
const bcrypt = require('bcrypt')
const { driverRegistrationSchema } = require('../schemas/driverSchema')
const { validateId } = require('../utils/validateId')

const { sendVerificationEmail } = require('../services/emailService')
const { generateVerificationToken, generateVerificationTokenExpiry } = require('../services/tokenService')
const { verifyEmail } = require('../services/emailVerificationService')

const registerDriver = async (req, res) => {
  const { error } = driverRegistrationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { first_name, last_name, email, phone, password, vehicle_details, status = 'active', is_active = true } = req.body

  // Check if the driver already exists by email or phone number
  const existingDriver = await knex('drivers').where('email', email).orWhere('phone', phone).first()

  if (existingDriver) {
    return res.status(400).json({
      message: 'Driver with this email or phone number already exists.'
    })
  }

  // Hash the password directly using bcrypt
  const hashedPassword = await bcrypt.hash(password, 10)

  // Generate the verification token and expiry time
  const verificationToken = generateVerificationToken()
  const verificationTokenExpiry = generateVerificationTokenExpiry(48) // 48 hours validity

  // Get the current time for created_at
  const currentTime = new Date().toISOString()

  // Insert the new driver into the database
  const [newDriver] = await knex('drivers')
    .insert({
      first_name,
      last_name,
      email,
      phone,
      vehicle_details,
      password_hash: hashedPassword,
      verification_token: verificationToken,
      verification_token_expiry: verificationTokenExpiry,
      status, // Set status (active by default)
      is_active, // Active status (default is true)
      created_at: currentTime
    })
    .returning('*')

  // Send the verification email
  await sendVerificationEmail(email, first_name, verificationToken, 'drivers')

  return res.status(201).json({
    message: 'Driver registered successfully!',
    driver: {
      id: newDriver.id,
      first_name: newDriver.first_name,
      last_name: newDriver.last_name,
      email: newDriver.email,
      phone: newDriver.phone,
      status: newDriver.status,
      is_active: newDriver.is_active
    }
  })
}

const getDriverById = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid driver ID' })
  }

  const driver = await knex('drivers').where({ id }).whereNull('deleted_at').first()

  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' })
  }

  res.json({
    id: driver.id,
    first_name: driver.first_name,
    last_name: driver.last_name,
    email: driver.email,
    phone: driver.phone,
    vehicle_details: driver.vehicle_details,
    status: driver.status,
    is_active: driver.is_active,
    created_at: driver.created_at,
    updated_at: driver.updated_at
  })
}

const getDriverProfile = async (req, res) => {
  const driverId = req.user.id

  const driver = await knex('drivers').select('id', 'first_name', 'last_name', 'email', 'phone', 'vehicle_details', 'status', 'is_active', 'created_at', 'updated_at').where({ id: driverId }).first()

  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' })
  }

  res.json({ driver })
}

const deleteDriver = async (req, res) => {
  const { id } = req.params
  const adminId = req.user.id

  // Validate the driver ID
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid driver ID' })
  }

  // Check if driver exists and is not already deleted
  const driver = await knex('drivers').where({ id }).first()
  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' })
  }

  if (driver.deleted_at) {
    return res.status(400).json({ message: 'Driver already deleted' })
  }

  // Perform soft delete
  await knex('drivers').where({ id }).update({
    deleted_at: new Date(),
    deleted_by: adminId
  })

  return res.json({ message: 'Driver deleted successfully (soft delete)' })
}

const recoverDriver = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid driver ID' })
  }

  const driver = await knex('drivers').where({ id }).first()
  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' })
  }

  if (!driver.deleted_at) {
    return res.status(400).json({ message: 'Driver is not deleted' })
  }

  await knex('drivers').where({ id }).update({
    deleted_at: null,
    deleted_by: null
  })

  return res.json({ message: 'Driver recovered successfully' })
}

const verifyDriverEmail = async (req, res) => {
  verifyEmail('drivers', req, res)
}

module.exports = { registerDriver, getDriverById, getDriverProfile, deleteDriver, recoverDriver, verifyDriverEmail }
