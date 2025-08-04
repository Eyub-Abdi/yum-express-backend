const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const config = require('../../config/default')
const { adminLoginSchema } = require('../schemas/adminSchema')

const loginAdmin = async (req, res) => {
  const { error } = adminLoginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { email, password } = req.body

  const admin = await knex('admins').where({ email }).first()
  if (!admin || !admin.verified || !admin.is_active) {
    return res.status(401).json({ message: 'Invalid credentials or account inactive/unverified' })
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash)
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  // Update last login
  await knex('admins').where({ id: admin.id }).update({
    last_login: knex.fn.now(),
    updated_at: knex.fn.now()
  })

  // Generate JWT
  const token = jwt.sign({ id: admin.id, type: 'admin', role: admin.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  })

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: admin.id,
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      type: 'admin',
      role: admin.role
    }
  })
}

module.exports = { loginAdmin }
