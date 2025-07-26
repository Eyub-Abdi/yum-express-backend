// const knex = require('../db/knex')
// const { verifySessionToken } = require('../utils/generateSessionToken')

// const verifySessionTokenMiddleware = async (req, res, next) => {
//   const sessionToken = req.cookies.session_token || null
//   console.log(sessionToken)

//   if (sessionToken) {
//     // First, fetch the session token and its stored signature
//     const cart = await knex('carts').select('session_token', 'signature').where({ session_token: sessionToken }).first()

//     if (!cart) {
//       console.log('Cart not found for session token:', sessionToken) // Debugging log
//       return res.status(404).json({ message: 'Cart not found for this session token' })
//     }

//     // Validate the session token signature before checking anything else
//     const isValid = verifySessionToken(sessionToken, cart.signature)

//     if (!isValid) {
//       console.log('Invalid signature for session token:', sessionToken) // Debugging log
//       return res.status(403).json({ message: 'Invalid or tampered session token' })
//     }

//     // If the signature is valid, proceed to the next step
//     req.sessionToken = sessionToken
//     return next()
//   }

//   // No session token found, proceed as guest
//   return next()
// }

// module.exports = verifySessionTokenMiddleware

const knex = require('../db/knex')
const { verifySessionToken } = require('../utils/generateSessionToken')

const verifySessionTokenMiddleware = async (req, res, next) => {
  const sessionToken = req.cookies.session_token || null
  console.log('Incoming session token:', sessionToken)
  console.log('Req', req.cookies.session_token)
  // return
  if (sessionToken) {
    const cart = await knex('carts').select('session_token', 'signature').where({ session_token: sessionToken }).first()

    if (!cart) {
      console.log('Cart not found for session token:', sessionToken)

      // Clear invalid cookie
      res.clearCookie('session_token', {
        httpOnly: true,
        sameSite: 'Lax',
        secure: false
      })

      return res.status(404).json({ message: 'Cart not found for this session token' })
    }

    const isValid = verifySessionToken(sessionToken, cart.signature)

    if (!isValid) {
      console.log('Invalid signature for session token:', sessionToken)

      // Clear tampered cookie
      res.clearCookie('session_token', {
        httpOnly: true,
        sameSite: 'Lax',
        secure: false
      })

      return res.status(403).json({ message: 'Invalid or tampered session token' })
    }

    // req.sessionToken = sessionToken
    return next()
  }

  // No cookie, just continue
  return next()
}

module.exports = verifySessionTokenMiddleware
// This middleware checks for a session token in the request cookies, validates it against the database,
// and ensures the token's signature is valid. If the token is invalid or not found,
// it clears the cookie and responds with an appropriate error message. If valid, it attaches the
// session token to the request object and calls the next middleware or route handler.
// This approach ensures that the session token is securely managed and validated before proceeding with any cart operations
