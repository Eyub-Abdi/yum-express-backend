const knex = require('../db/knex')
const bcrypt = require('bcrypt')
const { driverRegistrationSchema, driverQuerySchema, driverUpdateSchema } = require('../schemas/driverSchema')
const { validateId } = require('../utils/validateId')

const { generateVerificationToken, generateVerificationTokenExpiry } = require('../services/tokenService')
const { verifyEmail } = require('../services/emailVerificationService')
const generateDefaultPassword = require('../utils/passwordGenerator')
const { sendEmail } = require('../services/emailService')
const { sendSMS } = require('../services/smsService')
const { buildWelcomeMessage } = require('../utils/welcomeMessages')

const registerDriver = async (req, res) => {
  const { error } = driverRegistrationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { first_name, last_name, email, phone, vehicle_details, status = 'active', is_active = true } = req.body
  const password = generateDefaultPassword()
  console.log(`Generated default password for driver: ${password}`)

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

  // return res.status(500).json({
  //   message: 'Error sending verification email. Please try again later.'
  // })
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

  const message = buildWelcomeMessage(first_name, password)
  await sendSMS(phone, message)
  // Send verification email
  try {
    await sendEmail({ recipientEmail: email, firstName: first_name, type: 'verification', payload: { token: verificationToken, entityType: 'drivers' } })
  } catch (err) {
    console.error('Error sending verification email:', err)
  }
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

const updateDriver = async (req, res, next) => {
  const { id } = req.params

  const { error } = driverUpdateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid driver ID' })
  }
  const { first_name, last_name, email, phone, vehicle_details, status, is_active } = req.body

  const existingDriver = await knex('drivers').where({ id }).first()
  if (!existingDriver) {
    return res.status(404).json({ message: 'Driver not found.' })
  }

  if (email || phone) {
    const conflict = await knex('drivers')
      .where(function () {
        if (email) this.orWhere({ email })
        if (phone) this.orWhere({ phone })
      })
      .andWhereNot({ id })
      .first()

    if (conflict) {
      return res.status(400).json({ message: 'Email or phone already in use by another driver.' })
    }
  }

  const updateData = {
    ...(first_name && { first_name }),
    ...(last_name && { last_name }),
    ...(email && { email }),
    ...(phone && { phone }),
    ...(vehicle_details && { vehicle_details }),
    ...(status && { status }),
    ...(is_active !== undefined && { is_active }),
    updated_at: new Date().toISOString()
  }

  await knex('drivers').where({ id }).update(updateData)

  return res.status(200).json({ message: 'Driver updated successfully!' })
}

const getAllDrivers = async (req, res) => {
  const { error, value } = driverQuerySchema.validate(req.query)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { page, limit, search, sort_by, order } = value
  const offset = (page - 1) * limit

  const baseQuery = knex('drivers')
    .whereNull('deleted_at')
    .modify(qb => {
      if (search) {
        qb.andWhere(builder => {
          builder.whereILike('first_name', `%${search}%`).orWhereILike('last_name', `%${search}%`).orWhereILike('email', `%${search}%`).orWhereILike('phone', `%${search}%`)
        })
      }
    })

  const totalQuery = baseQuery.clone().count('* as count').first()
  const dataQuery = baseQuery.clone().select('id', 'first_name', 'last_name', 'email', 'phone', 'vehicle_details', 'status', 'is_active', 'created_at', 'updated_at').orderBy(sort_by, order).limit(limit).offset(offset)

  const [totalResult, drivers] = await Promise.all([totalQuery, dataQuery])

  res.json({
    total: totalResult.count,
    page,
    limit,
    drivers
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

module.exports = { registerDriver, getAllDrivers, getDriverById, getDriverProfile, deleteDriver, recoverDriver, verifyDriverEmail }
