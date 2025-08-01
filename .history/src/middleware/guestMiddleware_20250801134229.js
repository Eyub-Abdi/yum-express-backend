const config = require('../../config/default')
const jwt = require('jsonwebtoken')
const knex = require('../db/knex')
const { generateSessionToken } = require('../utils/generateSessionToken')

const authOrGuest = async (req, res, next) => {
  const token = req.headers['x-auth-token'] || req.headers['X-Auth-Token']

  if (token) {
    try {
      req.user = jwt.verify(token, config.jwt.secret)

      // Migrate guest cart if it exists
      const guestToken = req.cookies?.session_token
      if (guestToken) {
        console.log('Migrating guest cart for session:', guestToken)

        const guestCart = await knex('carts').where({ session_token: guestToken }).first()

        if (guestCart) {
          await knex('carts').where({ session_token: guestToken }).update({ customer_id: req.user.id, session_token: null, signature: null })

          res.clearCookie('session_token')
          console.log('Guest cart migrated and session token cleared')
        }
      }

      return next()
    } catch (err) {
      return res.status(403).json({ message: 'Invalid token' })
    }
  }

  // Guest user flow
  let sessionToken = req.cookies?.session_token
  console.log(sessionToken ? 'Existing guest session token found' : 'No guest session token found')
  if (sessionToken) {
    console.log('Reusing existing guest session token:', sessionToken)
  } else {
    sessionToken = generateSessionToken()
    // res.cookie('session_token', sessionToken, {
    //   httpOnly: true,
    //   maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    // })
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    console.log('New guest session token generated:', sessionToken)
  }

  req.sessionToken = sessionToken
  next()
}

module.exports = authOrGuest
