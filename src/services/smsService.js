const twilio = require('twilio')
const config = require('../../config/default')

const client = twilio(config.sms.accountSid, config.sms.authToken)

function sendOrderConfirmationSMS(toPhoneNumber, message) {
  return client.messages.create({
    body: message,
    from: config.sms.phoneNumber,
    to: toPhoneNumber
  })
}

module.exports = {
  sendOrderConfirmationSMS
}
