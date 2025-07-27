const express = require('express')
const router = express.Router()

// Handle a successful payment
const handlePaymentSuccess = async data => {
  const { transaction_reference, order_reference, amount } = data

  console.log('✅ PAYMENT RECEIVED:')
  console.log('Order Reference:', order_reference)
  console.log('Transaction Reference:', transaction_reference)
  console.log('Amount:', amount)

  // TODO: Update your order/payment status in the database
  // Example:
  // await db('orders').where({ order_reference }).update({ status: 'paid' })
}

// Handle a failed payment
const handlePaymentFailure = async data => {
  const { order_reference } = data

  console.log('❌ PAYMENT FAILED:')
  console.log('Order Reference:', order_reference)

  // TODO: Update order status in the database
  // Example:
  // await db('orders').where({ order_reference }).update({ status: 'failed' })
}

// Webhook route
router.post('/webhook-clickpesa', async (req, res) => {
  try {
    const { event, data } = req.body

    if (!event || !data) {
      console.warn('⚠️ Invalid webhook payload:', req.body)
      return res.status(400).json({ message: 'Invalid payload' })
    }

    console.log(`📩 Received ClickPesa webhook event: "${event}"`)

    switch (event) {
      case 'PAYMENT RECEIVED':
        await handlePaymentSuccess(data)
        break
      case 'PAYMENT FAILED':
        await handlePaymentFailure(data)
        break
      default:
        console.warn('⚠️ Unhandled webhook event:', event)
    }

    res.status(200).json({ status: 'received' })
  } catch (err) {
    console.error('🚨 Webhook processing error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
