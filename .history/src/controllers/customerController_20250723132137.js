// src/controllers/customerController.js
const debug = require('debug')('app')
const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const { customerRegistrationSchema, customerUpdateSchema, passwordUpdateSchema, customerNameSchema, phoneUpdateSchema } = require('../schemas/customerSchema')
const { validateId } = require('../utils/validateId')
const authorizeUser = require('../middleware/authenticateUser')
const { generateVerificationToken, generateVerificationTokenExpiry } = require('../services/tokenService')
const { sendVerificationEmail } = require('../services/emailService')
const { verifyEmail } = require('../services/emailVerificationService')

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
// const updateCustomerPhone = async (req, res) => {
//   const { error } = phoneUpdateSchema.validate(req.body)
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message })
//   }

//   const id = req.user.id
//   const { phone } = req.body

//   const customer = await knex('customers').where('id', id).first()
//   if (!customer) {
//     return res.status(404).json({ message: 'Customer not found' })
//   }

//   await knex('customers').where('id', id).update({
//     phone,
//     updated_at: new Date()
//   })

//   res.json({ message: 'Phone number updated successfully' })
// }

const updateCustomerPhone = async (req, res) => {
  const { id } = req.user
  const { phone } = req.body

  // 1. Validate phone format
  const { error } = phoneUpdateSchema.validate({ phone })
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  // 2. Check if customer exists
  const customer = await knex('customers').where({ id }).first()
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  // 3. Ensure phone number is not already taken by another customer
  const phoneTaken = await knex('customers').where({ phone }).andWhereNot({ id }).first()

  if (phoneTaken) {
    return res.status(400).json({ message: 'Phone number is already in use' })
  }

  // 4. Update the phone number
  await knex('customers').where({ id }).update({
    phone,
    updated_at: new Date()
  })

  res.json({ message: 'Phone number updated successfully' })
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
  verifyCustomerEmail
}
