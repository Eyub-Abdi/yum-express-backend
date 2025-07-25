// src/controllers/customerController.js
const debug = require('debug')('app')
const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const { customerRegistrationSchema, customerUpdateSchema, passwordUpdateSchema, customerNameSchema, phoneUpdateSchema, customerEmailUpdateSchema } = require('../schemas/customerSchema')
const { validateId } = require('../utils/validateId')
const { generateVerificationToken, generateVerificationTokenExpiry } = require('../services/tokenService')
const { sendVerificationEmail } = require('../services/emailService')
const { verifyEmail } = require('../services/emailVerificationService')
const { sendEmail } = require('../services/emailService')
const generateOtp = require('../utils/otpGenerator')
const { verifyOtp } = require('../services/otpVerificationService')

const registerCustomer = async (req, res) => {
  const { error } = customerRegistrationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { first_name, last_name, email, phone, password } = req.body

  // Check if the customer already exists by email or phone number
  const existingCustomer = await knex('customers').where('email', email).orWhere('phone', phone).first()

  if (existingCustomer) {
    return res.status(400).json({
      message: 'Customer with this email or phone number already exists.'
    })
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Generate the verification token and expiry time
  const verificationToken = generateVerificationToken()
  const verificationTokenExpiry = generateVerificationTokenExpiry(48) // 48 hours validity

  // Insert the new customer into the database
  const [newCustomer] = await knex('customers')
    .insert({
      first_name,
      last_name,
      email,
      phone,
      password_hash: hashedPassword,
      verification_token: verificationToken,
      verification_token_expiry: verificationTokenExpiry
    })
    .returning('*')

  // Send the verification email
  try {
    await sendVerificationEmail(email, first_name, verificationToken, 'customers')
  } catch (err) {
    console.error('Error sending verification email:', err)
  }

  return res.status(201).json({
    message: 'Customer registered successfully! Please verify your email address',
    customer: {
      id: newCustomer.id,
      first_name: newCustomer.first_name,
      last_name: newCustomer.last_name,
      email: newCustomer.email,
      phone: newCustomer.phone
    }
  })
}

const getCustomers = async (req, res) => {
  const customers = await knex('customers').select('id', 'first_name', 'last_name', 'email', 'phone') // Select only necessary fields

  res.json(customers) // Send the filtered customer data
}

const getCustomerProfile = async (req, res) => {
  const { id } = req.user

  const customer = await knex('customers').where({ id }).first()

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' })
  }

  const { password_hash, verification_token, verification_token_expiry, ...customerProfile } = customer

  res.json({ customer: customerProfile })
}

const getCustomerById = async (req, res) => {
  const { id } = req.params

  // Validate vendor_id using custom function
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid customer ID' })
  }

  const customer = await knex('customers').select('id', 'first_name', 'last_name', 'email', 'phone').where('id', id).first()

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  res.json(customer)
}

const updateCustomer = async (req, res) => {
  const { error } = customerUpdateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { id } = req.params
  // Validate vendor_id using custom function
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid customer ID' })
  }

  const { first_name, last_name, email, phone } = req.body

  // Check if customer exists
  const customer = await knex('customers').where('id', id).first()
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  // Update customer details
  await knex('customers').where('id', id).update({ first_name, last_name, email, phone })

  res.json({ message: 'Customer updated successfully' })
}

const updatePassword = async (req, res) => {
  // Validate input
  const { error } = passwordUpdateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }
  const customerId = req.user.id // Get ID from authenticated user
  const { old_password, new_password } = req.body

  // Fetch customer from DB
  const customer = await knex('customers').where('id', customerId).first()
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  // Verify old password
  const isMatch = await bcrypt.compare(old_password, customer.password_hash)
  if (!isMatch) {
    return res.status(400).json({ message: 'Incorrect old password' })
  }

  // Hash new password and update
  const hashedPassword = await bcrypt.hash(new_password, 10)
  await knex('customers').where('id', customerId).update({ password_hash: hashedPassword })

  res.json({ message: 'Password updated successfully' })
}

const deleteCustomer = async (req, res) => {
  let customerId = req.user.id

  // Admins can delete any customer by passing an ID in the request params
  if (req.user.type === 'admin' && req.params.id) {
    customerId = Number(req.params.id)
  } else if (req.params.id && Number(req.params.id) !== customerId) {
    // Regular users cannot delete others
    return res.status(403).json({ message: 'Unauthorized' })
  }

  // Check if the customer exists
  const customer = await knex('customers').where('id', customerId).first()
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  // Delete the customer
  await knex('customers').where('id', customerId).del()

  res.json({ message: 'Customer deleted successfully' })
}

const verifyCustomerEmail = async (req, res) => {
  await verifyEmail('customers', req, res)
}

const verifyCustomerOtp = async (req, res) => {
  await verifyOtp('customers', req, res)
}
// ==== CUSTOMER PROFILE UPDATION ====

const updateCustomerName = async (req, res) => {
  const { error } = customerNameSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const id = req.user.id
  const { first_name, last_name } = req.body

  const customer = await knex('customers').where('id', id).first()
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  await knex('customers').where('id', id).update({
    first_name,
    last_name,
    updated_at: new Date() // update timestamp
  })

  res.json({ message: 'Name updated successfully' })
}

const updateCustomerPhone = async (req, res) => {
  const { id } = req.user
  const { phone } = req.body

  const { error } = phoneUpdateSchema.validate({ phone })
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const customer = await knex('customers').where({ id }).first()
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  // Ensure phone number is not already taken by another customer
  const phoneTaken = await knex('customers').where({ phone }).andWhereNot({ id }).first()

  if (phoneTaken) {
    return res.status(400).json({ message: 'Phone number is already in use' })
  }

  // Update the phone number
  await knex('customers').where({ id }).update({
    phone,
    updated_at: new Date()
  })

  res.json({ message: 'Phone number updated successfully' })
}

const updateCustomerEmail = async (req, res) => {
  const { id } = req.user
  const { email } = req.body

  const { error } = customerEmailUpdateSchema.validate({ email })
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const customer = await knex('customers').where({ id }).first()
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  const emailTaken = await knex('customers').where({ email }).andWhereNot({ id }).first()

  if (emailTaken) {
    return res.status(400).json({ message: 'Email is already in use' })
  }

  // 4. Generate OTP
  const { code, expiry } = generateOtp(10)

  // 5. Update customer record
  await knex('customers').where({ id }).update({
    email,
    otp_code: code,
    otp_expiry: expiry,
    verified: false,
    updated_at: new Date()
  })

  // 6. Send OTP email
  try {
    await sendEmail({
      recipientEmail: email,
      firstName: customer.first_name,
      type: 'otp',
      payload: {
        otp: code,
        expiresIn: 10
      }
    })
  } catch (err) {
    console.error('Error sending OTP email:', err)
    return res.status(500).json({ message: 'Failed to send OTP email' })
  }

  res.json({ message: 'Verification code sent to new email. Please verify.' })
}

module.exports = {
  registerCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  updatePassword,
  deleteCustomer,
  getCustomerProfile,
  // ==== CUSTOMER PROFILE UPDATION ====
  updateCustomerName,
  updateCustomerPhone,
  updateCustomerEmail,
  verifyCustomerEmail,
  verifyCustomerOtp
}
