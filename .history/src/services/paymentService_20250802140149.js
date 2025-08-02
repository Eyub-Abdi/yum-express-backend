const axios = require('axios')
const logger = require('../utils/logger')
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
          Authorization: token,
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
    logger.error(err.message, err)
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
  console.log(token)
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
          Authorization: token,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // handle all statuses manually
      }
    )

    const { status: httpStatus, data } = res

    if (httpStatus === 200) {
      if (data.status === 'PROCESSING' || data.status === 'PENDING') {
        // Return success, but payment is still pending confirmation via webhook
        return {
          success: true,
          message: 'Payment is processing. Awaiting customer confirmation.',
          transaction_id: data.id,
          payment_method: paymentMethod,
          amount: totalPrice,
          status: 'PENDING' // explicitly inform client
        }
      }
      // Unexpected success status
      return {
        success: false,
        message: `USSD initiation failed with status: ${data.status}`,
        transaction_id: data.id || null,
        payment_method: paymentMethod,
        amount: 0
      }
    }

    // Handle known HTTP errors with clear messages
    if (httpStatus === 400) {
      return { success: false, message: 'Invalid / unsupported phone number' }
    }
    if (httpStatus === 401) {
      return { success: false, message: 'Unauthorized - check your token' }
    }
    if (httpStatus === 404) {
      return { success: false, message: 'Account has no payment collection methods' }
    }
    if (httpStatus === 409) {
      return { success: false, message: 'Order reference already used: create a different reference' }
    }

    // Handle other messages if present
    if (data.message) {
      if (data.message.includes('fee')) {
        return { success: false, message: 'Error validating fee, try again later' }
      }
      return { success: false, message: data.message }
    }

    // Fallback error
    return { success: false, message: 'Unknown error during USSD push initiation' }
  } catch (err) {
    logger.error('ClickPesa initiation failed:', err.message)
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
