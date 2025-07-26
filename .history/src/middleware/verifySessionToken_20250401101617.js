const knex = require('../db/knex')
const { verifySessionToken } = require('../utils/generateSessionToken')

const verifySessionTokenMiddleware = async (req, res, next) => {
  const sessionToken = req.cookies.session_token || null

  if (sessionToken) {
    // First, fetch the session token and its stored signature
    const cart = await knex('carts').select('session_token', 'signature').where({ session_token: sessionToken }).first()

    if (!cart) {
      console.log('Cart not found for session token:', sessionToken) // Debugging log
      return res.status(404).json({ message: 'Cart not found for this session token' })
    }

    // Validate the session token signature before checking anything else
    const isValid = verifySessionToken(sessionToken, cart.signature)

    if (!isValid) {
      console.log('Invalid signature for session token:', sessionToken) // Debugging log
      return res.status(403).json({ message: 'Invalid or tampered session token' })
    }

    // If the signature is valid, proceed to the next step
    req.sessionToken = sessionToken
    return next()
  }

  // No session token found, proceed as guest
  return next()
}

module.exports = verifySessionTokenMiddleware
