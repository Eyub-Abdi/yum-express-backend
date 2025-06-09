const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const config = require('../../config/default') // For secret and expiry
const { loginSchema } = require('../schemas/authSchema')

const loginDriver = async (req, res) => {
  // Validate input with Joi
  const { error } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { email, password } = req.body

  // Find driver by email
  const driver = await knex('drivers').where({ email }).first()
  if (!driver) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, driver.password_hash)
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  // Generate JWT token
  const token = jwt.sign({ id: driver.id, type: 'driver' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

  // Return response with token
  return res.status(200).json({
    message: 'Login successful',
    token, // Provide token to the driver
    user: {
      id: driver.id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      email: driver.email,
      phone: driver.phone,
      type: 'driver',
      vehicle_details: driver.vehicle_details
    }
  })
}

module.exports = { loginDriver }
