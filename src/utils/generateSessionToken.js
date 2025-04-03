const crypto = require('crypto')
const config = require('../../config/default')

// Function to generate a secure session token
function generateSessionToken() {
  return crypto.randomBytes(16).toString('hex') // Generates a 32-character hex string
}

// Function to generate HMAC signature for session token
const generateSignature = sessionToken => {
  const hmac = crypto.createHmac('sha256', config.session.secret)
  hmac.update(sessionToken) // Apply HMAC with your secret key
  return hmac.digest('hex') // Generate and return signature
}

// Function to verify if the session token is valid by checking the signature
const verifySessionToken = (sessionToken, storedSignature) => {
  const calculatedSignature = generateSignature(sessionToken)
  return storedSignature === calculatedSignature // Return true if the signature matches, else false
}

module.exports = { generateSessionToken, generateSignature, verifySessionToken }
