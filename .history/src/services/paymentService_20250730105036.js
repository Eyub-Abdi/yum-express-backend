// const axios = require('axios')
// const { getToken } = require('./clickpesaTokenManager')

// const processPayment = async (totalPrice, phoneNumber, orderReference) => {
//   const token = await getToken()
//   console.log(token)
//   try {
//     const res = await axios.post(
//       'https://api.clickpesa.com/third-parties/payments/initiate-ussd-push-request',
//       {
//         amount: totalPrice.toString(),
//         currency: 'TZS',
//         orderReference,
//         phoneNumber
//       },
//       {
//         headers: {
//           Authorization: `${token}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     )

//     const data = res.data

//     // Check payment initiation status carefully here
//     if (data.status === 'PENDING' || data.status === 'PROCESSING') {
//       return {
//         success: true,
//         message: 'USSD push initiated. Awaiting customer confirmation.',
//         transaction_id: data.id, // Keep this for DB reference
//         payment_method: 'Mobile',
//         amount: totalPrice
//       }
//     } else {
//       // Any other status means initiation failed
//       return {
//         success: false,
//         message: `USSD initiation failed`,
//         transaction_id: data.id || null,
//         payment_method: 'Mobile',
//         amount: 0
//       }
//     }
//   } catch (err) {
//     console.error('ClickPesa initiation failed:', err.response?.data || err.message)
//     return {
//       success: false,
//       message: 'ClickPesa API error during initiation',
//       transaction_id: null,
//       payment_method: null,
//       amount: 0
//     }
//   }
// }
// module.exports = { processPayment }

const axios = require('axios')
const { getToken } = require('./clickpesaTokenManager')

/**
 * Validate payment details with ClickPesa
 * @param {number|string} amount - Amount as number or string
 * @param {string} orderReference - Unique order reference (alphanumeric)
 * @returns {Promise<{valid: boolean, message?: string, availableMethods?: Array}>}
 */
const validatePayment = async (amount, orderReference) => {
  const token = await getToken()

  try {
    const res = await axios.post(
      'https://api.clickpesa.com/third-parties/payments/preview-ussd-push-request',
      {
        amount: amount.toString(),
        currency: 'TZS', // required field
        orderReference
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const activeMethods = res.data?.activeMethods || []
    const availableMethods = activeMethods.filter(m => m.status === 'AVAILABLE')

    if (availableMethods.length === 0) {
      return { valid: false, message: 'No available payment methods.' }
    }

    return { valid: true, availableMethods }
  } catch (err) {
    const status = err.response?.status
    const message = err.response?.data?.message || 'Validation error'

    if (status === 400) {
      return { valid: false, message: 'Invalid order reference format.' }
    } else if (status === 401) {
      return { valid: false, message: 'Unauthorized — check your token.' }
    } else if (status === 404) {
      return { valid: false, message: 'No payment methods available for this account.' }
    } else if (status === 409) {
      return { valid: false, message: 'Order reference already used — use a new one.' }
    } else {
      return { valid: false, message }
    }
  }
}

/**
 * Process payment: validate then initiate USSD push request
 * @param {number|string} totalPrice - Payment amount
 * @param {string} phoneNumber - Customer phone number (with country code, e.g., 2557xxxxxxx)
 * @param {string} orderReference - Unique order reference
 * @returns {Promise<object>} - Payment result
 */
const processPayment = async (totalPrice, phoneNumber, orderReference) => {
  const token = await getToken()

  // Step 1: Validate payment details first
  const validation = await validatePayment(totalPrice, orderReference)
  if (!validation.valid) {
    return {
      success: false,
      message: `Validation failed: ${validation.message}`,
      transaction_id: null,
      payment_method: null,
      amount: 0
    }
  }

  // Pick first available payment method
  const paymentMethod = validation.availableMethods[0].name

  try {
    const res = await axios.post(
      'https://api.clickpesa.com/third-parties/payments/initiate-ussd-push-request',
      {
        amount: totalPrice.toString(),
        currency: 'TZS', // required field
        orderReference,
        phoneNumber,
        paymentMethod // optional: confirm with API if supported
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = res.data

    if (data.status === 'PENDING' || data.status === 'PROCESSING') {
      return {
        success: true,
        message: 'USSD push initiated. Awaiting customer confirmation.',
        transaction_id: data.id,
        payment_method: paymentMethod,
        amount: totalPrice
      }
    } else {
      return {
        success: false,
        message: 'USSD initiation failed',
        transaction_id: data.id || null,
        payment_method: paymentMethod,
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

module.exports = { validatePayment, processPayment }
