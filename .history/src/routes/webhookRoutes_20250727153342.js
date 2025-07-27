// const express = require('express')
// const router = express.Router()

// // Handle a successful payment
// const handlePaymentSuccess = async data => {
//   const { transaction_reference, order_reference, amount } = data

//   console.log('✅ PAYMENT RECEIVED:')
//   console.log('Order Reference:', order_reference)
//   console.log('Transaction Reference:', transaction_reference)
//   console.log('Amount:', amount)

//   // TODO: Update your order/payment status in the database
//   // Example:
//   // await db('orders').where({ order_reference }).update({ status: 'paid' })
// }

// // Handle a failed payment
// const handlePaymentFailure = async data => {
//   const { order_reference } = data

//   console.log('❌ PAYMENT FAILED:')
//   console.log('Order Reference:', order_reference)

//   // TODO: Update order status in the database
//   // Example:
//   // await db('orders').where({ order_reference }).update({ status: 'failed' })
// }

// // Webhook route
// router.post('/clickpesa', async (req, res) => {
//   try {
//     const { event, data } = req.body

//     if (!event || !data) {
//       console.warn('⚠️ Invalid webhook payload:', req.body)
//       return res.status(400).json({ message: 'Invalid payload' })
//     }

//     console.log(`📩 Received ClickPesa webhook event: "${event}"`)

//     switch (event) {
//       case 'PAYMENT RECEIVED':
//         await handlePaymentSuccess(data)
//         break
//       case 'PAYMENT FAILED':
//         await handlePaymentFailure(data)
//         break
//       default:
//         console.warn('⚠️ Unhandled webhook event:', event)
//     }

//     res.status(200).json({ status: 'received' })
//   } catch (err) {
//     console.error('🚨 Webhook processing error:', err)
//     res.status(500).json({ error: 'Internal Server Error' })
//   }
// })

// module.exports = router

const express = require('express')
const router = express.Router()

// Handler for successful payment
const handlePaymentCompleted = async payload => {
  const { transaction_id, reference, amount, currency } = payload

  console.log('✅ Payment Completed:', reference, transaction_id, amount, currency)

  // Example DB update:
  // await db('orders').where({ order_reference: reference }).update({ status: 'paid' })
}

// Handler for failed/cancelled/etc. payments
const handlePaymentFailed = async payload => {
  const { reference } = payload

  console.log('❌ Payment Failed or Cancelled:', reference)

  // Example DB update:
  // await db('orders').where({ order_reference: reference }).update({ status: 'failed' })
}

router.post('/clickpesa', async (req, res) => {
  try {
    const { event_type, status } = req.body

    if (!event_type || !status) {
      return res.status(400).json({ message: 'Invalid payload' })
    }

    switch (event_type) {
      case 'payment.completed':
        await handlePaymentCompleted(req.body)
        break
      case 'payment.failed':
      case 'payment.cancelled':
        await handlePaymentFailed(req.body)
        break
      default:
        console.log('⚠️ Unhandled event_type:', event_type)
    }

    res.status(200).json({ status: 'received' })
  } catch (err) {
    console.error('Webhook Error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
