const axios = require('axios')
const config = require('../../config/default')

function getAuthHeader(username, password) {
  console.log(username + ':' + password)
  const base64 = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${base64}`
}

function getSMSApiUrl() {
  return config.sms.isTestMode ? 'https://messaging-service.co.tz/api/sms/v1/test/text/single' : 'https://messaging-service.co.tz/api/sms/v1/text/single'
}

/**
 * Sends an SMS message using Next SMS API
 * @param {string} toPhoneNumber
 * @param {string} message
 * @param {string} [reference='yum-express-ref']
 * @returns {Promise<Object>}
 */
function sendSMS(toPhoneNumber, message, reference = 'yum-express-ref') {
  const data = {
    from: '255684106419', //config.sms.senderId,
    to: toPhoneNumber,
    text: message,
    reference
  }
  // return console.log(console.log(data))
  return axios({
    method: 'post',
    url: getSMSApiUrl(),
    maxBodyLength: Infinity,
    headers: {
      Authorization: getAuthHeader(config.sms.username, config.sms.password),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    data
  })
    .then(res => {
      console.log('SMS sent:', res.data)
      return res.data
    })
    .catch(err => {
      console.error('SMS failed:', err.response?.data || err.message)
      throw err
    })
}

module.exports = {
  sendSMS
}
