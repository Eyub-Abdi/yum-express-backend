const knex = require('../db/knex')

// List of valid entities
const validEntities = ['vendors', 'customers', 'drivers', 'admins']

// OTP verification (email or phone)
const verifyOtp = async (entity, req, res) => {
  if (!validEntities.includes(entity)) {
    return res.status(400).json({ message: 'Invalid entity for verification' })
  }

  const { email, phone, otp } = req.body

  if (!otp || (!email && !phone)) {
    return res.status(400).json({ message: 'OTP and either email or phone are required' })
  }

  // Build query conditions dynamically
  const whereClause = { otp_code: otp }
  if (email) whereClause.email = email
  if (phone) whereClause.phone = phone

  // Look for matching user with valid OTP
  const user = await knex(entity).where(whereClause).andWhere('otp_expiry', '>', new Date()).first()

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired OTP' })
  }

  // Mark user as verified and clear OTP
  await knex(entity).where({ id: user.id }).update({
    verified: true,
    otp_code: null,
    otp_expiry: null,
    updated_at: new Date()
  })

  return res.json({ message: 'Verification successful!' })
}

module.exports = { verifyOtp }
