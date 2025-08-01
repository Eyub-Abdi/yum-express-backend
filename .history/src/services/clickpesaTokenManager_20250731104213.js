const axios = require('axios')
const config = require('../../config/default')

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
    console.log(res.data)
    const jwt = res.data.token
    const [, payload] = jwt.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    token = jwt
    tokenExp = decoded.exp

    return token
  } catch (err) {
    console.error('Failed to generate Clik Pesa token:', err.response?.data || err.message)
    throw err
  }
}

async function getToken() {
  const now = Math.floor(Date.now() / 1000)
  if (!token || now >= tokenExp) {
    console.log('Refreshing Clik Pesa token...')
    return await generateToken()
  }
  return token
}

module.exports = { getToken }
