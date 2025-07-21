const otpGenerator = require('otp-generator')

function generateOtp(minutesValid = 10) {
  const code = otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  })

  const expiry = new Date(Date.now() + minutesValid * 60 * 1000)

  return { code, expiry }
}

module.exports = generateOtp
