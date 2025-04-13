const knex = require('../db/knex')

// List of valid entities
const validEntities = ['vendors', 'customers', 'drivers', 'admins']

// Reusable verification logic
const verifyEmail = async (entity, req, res) => {
  // Validate that the entity is one of the valid entities
  if (!validEntities.includes(entity)) {
    return res.status(400).json({ message: 'Invalid entity for email verification' })
  }

  const { token } = req.query

  if (!token) {
    return res.status(400).json({ message: 'Invalid verification token' })
  }

  // Find the entity (vendor, customer, or admin) with the given token and check if it's still valid
  const user = await knex(entity).where({ verification_token: token }).andWhere('verification_token_expiry', '>', new Date()).first()

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' })
  }

  // Update the entity to mark as verified
  await knex(entity).where({ id: user.id }).update({
    verified: true,
    verification_token: null,
    verification_token_expiry: null,
    updated_at: new Date()
  })

  // return res.json({ message: 'Email verified successfully!' })
  return res.redirect(`http://127.0.0.1:5000/`)
}

module.exports = { verifyEmail }
