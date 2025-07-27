const express = require('express')
const router = express.Router()

// Example: success handler
const handlePaymentSuccess = async data => {
  const { transaction_reference, order_reference, amount } = data

  // Example: Update order/payment status in DB
  console.log('✅ Payment Received:', order_reference, transaction_reference, amount)

  // You might do something like:
  // await db('orders').where({ order_reference }).update({ status: 'paid' })
}

// Example: failure handler
const handlePaymentFailure = async data => {
  const { order_reference } = data

  console.log('❌ Payment Failed:', order_reference)

  // Update status to failed
  // await db('orders').where({ order_reference }).update({ status: 'failed' })
}

router.post('/webhook-clickpesa', async (req, res) => {
  try {
    const { event, data } = req.body

    if (!event || !data) return res.status(400).json({ message: 'Invalid payload' })

    switch (event) {
      case 'PAYMENT RECEIVED':
        await handlePaymentSuccess(data)
        break
      case 'PAYMENT FAILED':
        await handlePaymentFailure(data)
        break
      default:
        console.log('⚠️ Unknown event:', event)
    }

    res.status(200).json({ status: 'received' })
  } catch (err) {
    console.error('Webhook Error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
