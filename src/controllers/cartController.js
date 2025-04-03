const knex = require('../db/knex')
const { generateSessionToken, generateSignature } = require('../utils/generateSessionToken')

const createCart = async (req, res) => {
  const { sessionToken, user } = req
  let cartData = {}

  if (user) {
    // Authenticated user: Check if they already have an active cart
    const existingCart = await knex('carts')
      .where({ customer_id: user.id })
      .andWhere('expires_at', '>', knex.fn.now()) // Ensure it's still valid
      .first()

    if (existingCart) {
      return res.status(200).json({ cart: existingCart }) // Return existing cart
    }

    cartData.customer_id = user.id
  } else {
    // Guest user: Check if they already have an active cart
    let existingCart = null
    if (sessionToken) {
      existingCart = await knex('carts').where({ session_token: sessionToken }).andWhere('expires_at', '>', knex.fn.now()).first()
    }

    if (existingCart) {
      return res.status(200).json({ cart: existingCart }) // Return existing cart
    }

    // Generate a session token if not present
    const newSessionToken = sessionToken || generateSessionToken()
    cartData.session_token = newSessionToken

    // Set the token in cookies for future requests
    res.cookie('session_token', newSessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
  }

  // Set cart expiration to 7 days from now
  cartData.expires_at = knex.raw("CURRENT_TIMESTAMP + INTERVAL '7 days'")

  // Generate signature for the session token
  const signature = generateSignature(cartData.session_token)
  cartData.signature = signature

  // Insert a new cart with signature
  const [cart] = await knex('carts').insert(cartData).returning('*')

  return res.status(201).json({ cart })
}

module.exports = { createCart }
