const axios = require('axios')
const { getToken } = require('./clickpesaTokenManager')

const processPayment = async (totalPrice, phoneNumber, orderReference) => {
  const token = await getToken()

  try {
    const res = await axios.post(
      'https://api.clickpesa.com/third-parties/payments/initiate-ussd-push-request',
      {
        amount: totalPrice.toString(),
        currency: 'TZS',
        orderReference,
        phoneNumber
      },
      {
        headers: {
          Authorization: `${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = res.data

    // Check payment initiation status carefully here
    if (data.status === 'PENDING' || data.status === 'PROCESSING') {
      return {
        success: true,
        message: 'USSD push initiated. Awaiting customer confirmation.',
        transaction_id: data.id, // Keep this for DB reference
        payment_method: 'USSD',
        amount: totalPrice
      }
    } else {
      // Any other status means initiation failed
      return {
        success: false,
        message: `USSD initiation failed`,
        transaction_id: data.id || null,
        payment_method: 'USSD',
        amount: 0
      }
    }
  } catch (err) {
    console.error('ClickPesa initiation failed:', err.response?.data || err.message)
    return {
      success: false,
      message: 'ClickPesa API error during initiation',
      transaction_id: null,
      payment_method: null,
      amount: 0
    }
  }
}
module.exports = { processPayment }
