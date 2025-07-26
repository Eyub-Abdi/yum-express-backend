const config = require('../../config/default')
const jwt = require('jsonwebtoken')
const knex = require('../db/knex')
const { generateSessionToken } = require('../utils/generateSessionToken')

const authOrGuest = async (req, res, next) => {
  return next() // Skip this middleware for now, as it is not needed in the current context
  const token = req.headers['x-auth-token'] || req.headers['X-Auth-Token']
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwt.secret)

      // Migrate guest cart if it exists
      if (req.cookies?.session_token) {
        const sessionToken = req.cookies.session_token
        const guestCart = await knex('carts').where({ session_token: sessionToken }).first()

        if (guestCart) {
          // Update the cart with the authenticated user ID
          await knex('carts').where({ session_token: sessionToken }).update({ customer_id: req.user.id, session_token: null, signature: null })

          // Optionally, clear the session token cookie
          res.clearCookie('session_token')
        }
      }

      return next() // Proceed to the next middleware
    } catch (err) {
      return res.status(403).json({ message: 'Invalid token' })
    }
  }

  // No token → Treat as guest user
  let sessionToken = req.cookies?.session_token

  if (!sessionToken) {
    sessionToken = generateSessionToken()
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
  }

  req.sessionToken = sessionToken // Attach session token for guest tracking
  console.log('Guest session token:', sessionToken)
  next()
}

module.exports = authOrGuest
