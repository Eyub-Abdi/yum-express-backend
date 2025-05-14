// src/controllers/authController.js

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const config = require('../../config/default')
const { loginSchema } = require('../schemas/authSchema')

const loginCustomer = async (req, res) => {
  // Validate input with Joi
  const { error } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { email, password } = req.body

  // Find customer by email
  const customer = await knex('customers').where({ email }).first()
  if (!customer) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }
  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, customer.password_hash)
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  // Generate JWT token
  const token = jwt.sign({ id: customer.id, type: 'customer' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      type: 'customer'
    }
  })
}

module.exports = { loginCustomer }
