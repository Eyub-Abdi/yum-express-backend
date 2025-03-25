const crypto = require('crypto') // Importing crypto for random token generation

// Function to generate a random verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString('hex') // Generate a random 20-byte string
}

// Function to generate token expiry time (1 hour validity)
const generateVerificationTokenExpiry = () => {
  return new Date(Date.now() + 3600000) // Token valid for 1 hour
}

module.exports = {
  generateVerificationToken,
  generateVerificationTokenExpiry
}
