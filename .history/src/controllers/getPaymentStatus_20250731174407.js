const knex = require('../db/knex')

const getPaymentStatus = async (req, res) => {
  const { orderReference, transaction_id } = req.query

  if (!orderReference && !transaction_id) {
    return res.status(400).json({ message: 'orderReference or transaction_id is required' })
  }

  let payment, pending

  if (transaction_id) {
    // Check pending payments by transaction_id
    pending = await knex('pending_payments').where({ transaction_id }).first()

    if (pending) {
      return res.json({ status: 'Pending' })
    }

    // Check confirmed payments by transaction_id
    payment = await knex('payments').where({ transaction_id }).orderBy('created_at', 'desc').first()
  } else {
    // Check pending payments by order_reference
    pending = await knex('pending_payments').where({ order_reference: orderReference }).first()

    if (pending) {
      return res.json({ status: 'Pending' })
    }

    // Check confirmed payments by order_reference or linked order_id
    payment = await knex('payments')
      .where(function () {
        this.where('order_reference', orderReference).orWhereIn('order_id', function () {
          this.select('id').from('orders').where({ order_reference: orderReference })
        })
      })
      .orderBy('created_at', 'desc')
      .first()
  }

  if (!payment) {
    return res.status(404).json({ status: 'NotFound' })
  }

  // Simplify the status for client
  let status = payment.status.toLowerCase()
  if (status === 'completed' || status === 'success') status = 'Completed'
  else if (status === 'failed' || status === 'cancelled') status = 'Failed'
  else if (status === 'pending') status = 'Pending'
  else status = 'Unknown'

  return res.json({
    status,
    transaction_id: payment.transaction_id,
    amount: payment.amount,
    order_id: payment.order_id,
    order_reference: payment.order_reference,
    created_at: payment.created_at
  })
}

module.exports = { getPaymentStatus }
