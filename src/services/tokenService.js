const crypto = require('crypto')

// Function to generate a random verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString('hex') // Generate a random 20-byte string
}

// Function to generate token expiry time (takes validity in hours as a parameter)
const generateVerificationTokenExpiry = (validityInHours = 1) => {
  return new Date(Date.now() + validityInHours * 3600000) // Token valid for the given number of hours
}

module.exports = {
  generateVerificationToken,
  generateVerificationTokenExpiry
}
