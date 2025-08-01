const knex = require('../db/knex')

const getPaymentStatus = async (req, res) => {
  const { orderReference, transaction_id } = req.query

  if (!orderReference && !transaction_id) {
    return res.status(400).json({ message: 'orderReference or transaction_id is required' })
  }

  let payment

  if (transaction_id) {
    // Priority 1: Look up by transaction ID
    payment = await knex('payments').where({ transaction_id }).orderBy('created_at', 'desc').first()
  } else {
    // Priority 2: Check pending payments first
    const pending = await knex('pending_payments').where({ order_reference: orderReference }).first()

    if (pending) {
      return res.json({ status: 'Pending' })
    }

    // Priority 3: Check confirmed payments
    payment = await knex('payments')
      .where(function () {
        this.where('order_reference', orderReference).orWhereIn('order_id', function () {
          this.select('id').from('orders').where({ order_reference: orderReference }) // corrected column name
        })
      })
      .orderBy('created_at', 'desc')
      .first()
  }

  if (!payment) {
    return res.status(404).json({ status: 'NotFound' })
  }

  return res.json({ status: payment.status }) // returning only status
}

module.exports = { getPaymentStatus }
