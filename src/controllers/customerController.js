// src/controllers/customerController.js
const debug = require('debug')('app')
const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const { customerRegistrationSchema, customerUpdateSchema, passwordUpdateSchema } = require('../schemas/customerSchema')

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

  // Insert the new customer into the database
  const [newCustomer] = await knex('customers')
    .insert({
      first_name,
      last_name,
      email,
      phone,
      password_hash: hashedPassword
    })
    .returning('*')

  return res.status(201).json({
    message: 'Customer registered successfully!',
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

const getCustomerById = async (req, res) => {
  const { id } = req.params

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

  const { id } = req.params
  const { old_password, new_password } = req.body

  // Check if customer exists
  const customer = await knex('customers').where('id', id).first()
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  // Verify old password
  const isMatch = await bcrypt.compare(old_password, customer.password_hash)
  if (!isMatch) {
    return res.status(400).json({ message: 'Incorrect old password' })
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(new_password, 10)

  // Update the password
  await knex('customers').where('id', id).update({ password_hash: hashedPassword })

  res.json({ message: 'Password updated successfully' })
}

module.exports = {
  registerCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  updatePassword
}
