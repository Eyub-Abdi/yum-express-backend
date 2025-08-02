const axios = require('axios')
const config = require('../../config/default')
const logger = require('../utils/logger')

let token = null
let tokenExp = 0

async function generateToken() {
  try {
    const res = await axios.post('https://api.clickpesa.com/third-parties/generate-token', null, {
      headers: {
        'client-id': config.payment.clientId,
        'api-key': config.payment.apiKey
      }
    })
    const jwt = res.data.token
    const [, payload] = jwt.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    token = jwt
    tokenExp = decoded.exp

    return token
  } catch (err) {
    logger.error('Failed to generate Clik Pesa token:', err)
    // throw err
  }
}

async function getToken() {
  const now = Math.floor(Date.now() / 1000)
  if (!token || now >= tokenExp) {
    logger.info('Refreshing Clik Pesa token...')
    return await generateToken()
  }
  return token
}

module.exports = { getToken }
