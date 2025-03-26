// src/controllers/authController.js

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const config = require('../../config/default')
const { loginSchema } = require('../schemas/authSchema')

const loginVendor = async (req, res) => {
  // Validate input
  const { error } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { email, password } = req.body

  // Find vendor by email
  const vendor = await knex('vendors').where({ email }).first()
  if (!vendor) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, vendor.password_hash)
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  // Generate JWT token
  const token = jwt.sign({ id: vendor.id, type: 'vendor' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

  res.json({ message: 'Login successful', token })
}

module.exports = { loginVendor }
