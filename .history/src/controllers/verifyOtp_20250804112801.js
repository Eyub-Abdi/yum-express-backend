const knex = require('../db/knex')
const logger = require('../utils/logger')
// List of valid entities
const validEntities = ['vendors', 'customers', 'drivers', 'admins']

const verifyOtp = async (entity, req, res) => {
  if (!validEntities.includes(entity)) {
    return res.status(400).json({ message: 'Invalid entity for OTP verification' })
  }

  const { value, code } = req.body // e.g., { value: 'user@example.com', code: '123456' }
  if (!value || !code) {
    return res.status(400).json({ message: 'Email and OTP code are required' })
  }

  try {
    const user = await knex(entity)
      .where(builder => {
        builder.where('email', value).orWhere('phone', value)
      })
      .andWhere('otp_code', code)
      .andWhere('otp_expiry', '>', new Date())
      .first()

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' })
    }

    // Clear OTP and mark as verified
    await knex(entity).where({ id: user.id }).update({
      verified: true,
      otp_code: null,
      otp_expiry: null,
      updated_at: new Date()
    })

    return res.json({ message: 'Verification successful' })
  } catch (err) {
    logger.error('OTP verification error:', err)
  }
}

module.exports = { verifyOtp }
