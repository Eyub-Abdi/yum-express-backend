const knex = require('../db/knex')

const getPaymentStatus = async (req, res) => {
  const { orderReference, transaction_id } = req.query

  if (!orderReference && !transaction_id) {
    return res.status(400).json({ message: 'orderReference or transaction_id is required' })
  }

  let payment

  if (transaction_id) {
    payment = await knex('payments').where({ transaction_id }).orderBy('created_at', 'desc').first()
  } else {
    const pending = await knex('pending_payments').where({ order_reference: orderReference }).first()

    if (pending) {
      return res.json({
        status_code: 0,
        status: 'Pending'
      })
    }

    payment = await knex('payments')
      .where(function () {
        this.where('order_reference', orderReference).orWhereIn('order_id', function () {
          this.select('id').from('orders').where({ reference: orderReference })
        })
      })
      .orderBy('created_at', 'desc')
      .first()
  }

  if (!payment) {
    return res.status(200).json({
      status_code: 3,
      status: 'NotFound'
    })
  }

  let statusCode = 2 // Default: Failed
  if (payment.status === 'Success') statusCode = 1
  else if (payment.status === 'Pending') statusCode = 0

  return res.json({
    status_code: statusCode,
    status: payment.status,
    transaction_id: payment.transaction_id,
    amount: payment.amount,
    order_id: payment.order_id,
    order_reference: payment.order_reference,
    created_at: payment.created_at
  })
}

module.exports = { getPaymentStatus }
