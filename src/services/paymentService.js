const axios = require('axios')
const { getToken } = require('./clickpesaTokenManager')

const processPayment = async (totalPrice, phoneNumber, orderReference) => {
  const token = await getToken()

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

  if (data?.status === 'PENDING') {
    return {
      success: null, // payment still in progress
      message: 'USSD push sent. Awaiting user confirmation.',
      transaction_id: data.transactionId || null,
      payment_method: 'USSD',
      amount: totalPrice
    }
  }

  if (data?.status === 'FAILED') {
    return {
      success: false,
      message: 'Payment was rejected by the user.',
      transaction_id: null,
      payment_method: null,
      amount: 0
    }
  }

  return {
    success: false,
    message: 'Payment initiation failed.',
    transaction_id: null,
    payment_method: null,
    amount: 0
  }
}

module.exports = { processPayment }
