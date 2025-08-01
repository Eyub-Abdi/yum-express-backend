const knex = require('../db/knex')

const getPaymentStatus = async (req, res) => {
  const { orderReference, transaction_id } = req.query

  if (!orderReference && !transaction_id) {
    return res.status(400).json({ message: 'orderReference or transaction_id is required' })
  }

  try {
    let payment

    if (transaction_id) {
      payment = await knex('payments').where({ transaction_id }).orderBy('created_at', 'desc').first()
    } else {
      const pending = await knex('pending_payments').where({ order_reference: orderReference }).first()

      if (pending) {
        return res.json({ status: 'Pending', orderReference })
      }

      // If not pending, check in confirmed payments
      payment = await knex('payments')
        .where('message', 'like', `%${orderReference}%`) // If you're saving orderReference in message
        .orWhereIn('order_id', function () {
          this.select('id').from('orders').where({ reference: orderReference })
        })
        .orderBy('created_at', 'desc')
        .first()
    }

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    return res.json({
      status: payment.status,
      transaction_id: payment.transaction_id,
      amount: payment.amount,
      order_id: payment.order_id,
      message: payment.message,
      created_at: payment.created_at
    })
  } catch (err) {
    console.error('Error fetching payment status:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { getPaymentStatus }
