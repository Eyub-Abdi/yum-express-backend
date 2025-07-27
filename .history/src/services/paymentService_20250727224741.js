// const axios = require('axios')
// const { getToken } = require('./clickpesaTokenManager')

// const processPayment = async (totalPrice, phoneNumber, orderReference) => {
//   const token = await getToken()
//   // Step 1: Initiate the payment (USSD push request)
//   const res = await axios.post(
//     'https://api.clickpesa.com/third-parties/payments/initiate-ussd-push-request',
//     {
//       amount: totalPrice.toString(),
//       currency: 'TZS',
//       orderReference,
//       phoneNumber
//     },
//     {
//       headers: {
//         Authorization: `${token}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   )

//   const data = res.data

//   if (data?.status === 'PENDING') {
//     return {
//       success: null,
//       message: 'USSD push sent. Awaiting user confirmation.',
//       transaction_id: data.transactionId || null,
//       payment_method: 'USSD',
//       amount: totalPrice
//     }
//   }

//   if (data?.status === 'FAILED') {
//     return {
//       success: false,
//       message: 'Payment was rejected by the user.',
//       transaction_id: null,
//       payment_method: null,
//       amount: 0
//     }
//   }

//   // Step 2: Query the payment status using the orderReference
//   const paymentStatusRes = await axios.get(`https://api.clickpesa.com/third-parties/payments/${orderReference}`, {
//     headers: {
//       Authorization: `${token}`
//     }
//   })

//   const paymentStatusData = paymentStatusRes.data?.[0] // <-- FIXED

//   if (!paymentStatusData) {
//     return {
//       success: false,
//       message: 'Could not retrieve payment status.',
//       transaction_id: null,
//       payment_method: null,
//       amount: 0
//     }
//   }

//   const { status, paymentReference } = paymentStatusData

//   if (status === 'SUCCESS' || status === 'SETTLED') {
//     return {
//       success: true,
//       message: 'Payment successfully completed.',
//       transaction_id: paymentReference || null,
//       payment_method: 'USSD',
//       amount: totalPrice
//     }
//   }

//   if (status === 'PROCESSING') {
//     return {
//       success: null,
//       message: 'Payment is processing. Please wait for confirmation.',
//       transaction_id: paymentReference || null,
//       payment_method: 'USSD',
//       amount: totalPrice
//     }
//   }

//   if (status === 'PENDING') {
//     return {
//       success: null,
//       message: 'USSD push sent. Awaiting user confirmation.',
//       transaction_id: paymentReference || null,
//       payment_method: 'USSD',
//       amount: totalPrice
//     }
//   }

//   if (status === 'FAILED') {
//     return {
//       success: false,
//       message: 'Payment was rejected by the user.',
//       transaction_id: null,
//       payment_method: null,
//       amount: 0
//     }
//   }

//   return {
//     success: false,
//     message: 'Payment initiation failed or status could not be determined.',
//     transaction_id: null,
//     payment_method: null,
//     amount: 0
//   }
// }

// module.exports = { processPayment }

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
        message: `USSD initiation failed with status: ${data.status}`,
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
