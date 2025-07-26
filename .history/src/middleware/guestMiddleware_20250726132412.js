// const config = require('../../config/default')
// const jwt = require('jsonwebtoken')
// const knex = require('../db/knex')
// const { generateSessionToken } = require('../utils/generateSessionToken')

// const authOrGuest = async (req, res, next) => {
//   const token = req.headers['x-auth-token'] || req.headers['X-Auth-Token']
//   if (token) {
//     try {
//       req.user = jwt.verify(token, config.jwt.secret)

//       // Migrate guest cart if it exists
//       if (req.cookies?.session_token) {
//         const sessionToken = req.cookies.session_token
//         const guestCart = await knex('carts').where({ session_token: sessionToken }).first()

//         if (guestCart) {
//           // Update the cart with the authenticated user ID
//           await knex('carts').where({ session_token: sessionToken }).update({ customer_id: req.user.id, session_token: null, signature: null })

//           // Optionally, clear the session token cookie
//           res.clearCookie('session_token')
//         }
//       }

//       return next() // Proceed to the next middleware
//     } catch (err) {
//       return res.status(403).json({ message: 'Invalid token' })
//     }
//   }

//   // No token → Treat as guest user
//   let sessionToken = req.cookies?.session_token

//   if (!sessionToken) {
//     sessionToken = generateSessionToken()
//     res.cookie('session_token', sessionToken, {
//       httpOnly: true,
//       maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//     })
//   }

//   req.sessionToken = sessionToken // Attach session token for guest tracking
//   console.log('Guest session token:', sessionToken)
//   next()
// }

// module.exports = authOrGuest

// const config = require('../../config/default')
// const jwt = require('jsonwebtoken')
// const knex = require('../db/knex')
// const { generateSessionToken } = require('../utils/generateSessionToken')

// const authOrGuest = async (req, res, next) => {
//   try {
//     const token = req.headers['x-auth-token'] || req.headers['X-Auth-Token']

//     if (token) {
//       // Authenticated user
//       try {
//         req.user = jwt.verify(token, config.jwt.secret)

//         // If there's a guest session token, migrate the cart to the user
//         const guestToken = req.cookies?.session_token
//         if (guestToken) {
//           const guestCart = await knex('carts').where({ session_token: guestToken }).first()

//           if (guestCart) {
//             await knex('carts').where({ session_token: guestToken }).update({
//               customer_id: req.user.id,
//               session_token: null,
//               signature: null
//             })

//             res.clearCookie('session_token')
//             console.log('Guest cart migrated to user and session token cleared.')
//           }
//         }

//         return next()
//       } catch (err) {
//         return res.status(403).json({ message: 'Invalid token' })
//       }
//     }

//     // Guest user
//     let sessionToken = req.cookies?.session_token

//     if (!sessionToken) {
//       sessionToken = generateSessionToken()
//       res.cookie('session_token', sessionToken, {
//         httpOnly: true,
//         maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//       })
//       console.log('New guest session token generated:', sessionToken)
//     } else {
//       console.log('Reusing existing guest session token:', sessionToken)
//     }

//     req.sessionToken = sessionToken
//     next()
//   } catch (error) {
//     console.error('authOrGuest error:', error)
//     res.status(500).json({ message: 'Internal server error' })
//   }
// }

// module.exports = authOrGuest

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

  if (sessionToken) {
    console.log('Reusing existing guest session token:', sessionToken)
  } else {
    sessionToken = generateSessionToken()
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    console.log('New guest session token generated:', sessionToken)
  }

  req.sessionToken = sessionToken
  next()
}

module.exports = authOrGuest
