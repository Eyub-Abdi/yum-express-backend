const knex = require('../db/knex')

const getAllPayments = async (req, res) => {
  const payments = await knex('payments').join('orders', 'payments.order_id', 'orders.id').join('customers', 'orders.customer_id', 'customers.id').select('payments.id', 'payments.order_id', 'payments.amount', 'payments.payment_method', 'payments.status', 'payments.transaction_id', 'payments.order_reference', 'payments.message', 'payments.created_at', 'customers.first_name', 'customers.last_name').orderBy('payments.created_at', 'desc')

  res.json({ payments })
}

module.exports = { getAllPayments }
