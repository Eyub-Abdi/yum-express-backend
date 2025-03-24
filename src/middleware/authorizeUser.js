const jwt = require('jsonwebtoken')
const config = require('../../config/default')

const authorizeUser = (req, res, next) => {
  // Get token from the custom 'x-auth-token' header
  const token = req.headers['x-auth-token']

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded // Attach user data (id & type) to request
    next()
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' })
  }
}

module.exports = authorizeUser
