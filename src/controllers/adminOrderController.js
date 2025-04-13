const knex = require('../db/knex')
const { validateId } = require('../utils/validateId')
const { getAllOrdersQuerySchema } = require('../schemas/adminOrderSchema')

const getAllOrders = async (req, res) => {
  const { error, value } = getAllOrdersQuerySchema.validate(req.query)

  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { page, limit, status, customer_id, vendor_id, sort_by, sort_order, start_date, end_date } = value

  const offset = (page - 1) * limit

  const query = knex('orders').select('orders.*').orderBy(sort_by, sort_order).limit(limit).offset(offset)

  // Filters
  if (status) {
    query.where('orders.status', status)
  }

  if (customer_id && validateId(customer_id)) {
    query.where('orders.customer_id', customer_id)
  }

  if (vendor_id && validateId(vendor_id)) {
    query.join('order_items', 'orders.id', 'order_items.order_id').join('products', 'order_items.product_id', 'products.id').where('products.vendor_id', vendor_id).groupBy('orders.id')
  }

  if (start_date && end_date) {
    query.whereBetween('orders.created_at', [new Date(start_date), new Date(end_date)])
  }

  const orders = await query

  res.json({
    page,
    limit,
    total: orders.length,
    data: orders
  })
}

module.exports = { getAllOrders }
