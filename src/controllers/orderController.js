const knex = require('../db/knex')
const { getVendorOrdersSchema, updateVendorOrderStatusSchema } = require('../schemas/vendorOrderSchema')
const { validateId } = require('../utils/validateId')

const getVendorOrders = async (req, res) => {
  // Allow access only if the authenticated user is a vendor
  if (req.user?.type !== 'vendor') {
    return res.status(403).json({ error: 'Access denied: Vendors only' })
  }

  // Validate query parameters using Joi schema
  const { error, value } = getVendorOrdersSchema.validate(req.query)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const vendorId = req.user.id

  // Destructure filter options from validated query parameters
  const { status, start_date, end_date, product_name, customer_name } = value

  // Build the query for vendor orders
  let query = knex('vendor_orders').where('vendor_orders.vendor_id', vendorId).join('orders', 'vendor_orders.order_id', 'orders.id').join('customers', 'orders.customer_id', 'customers.id').select('vendor_orders.id as vendor_order_id', 'vendor_orders.status as vendor_order_status', 'vendor_orders.tracking_number', 'vendor_orders.shipped_at', 'vendor_orders.delivered_at', 'vendor_orders.vendor_price', 'orders.id as order_id', 'orders.created_at as order_created_at', 'customers.id as customer_id', knex.raw("CONCAT(customers.first_name, ' ', customers.last_name) as customer_name"), 'customers.phone as customer_phone')

  // Apply filters based on query parameters
  if (status) {
    query = query.where('vendor_orders.status', status)
  }
  if (start_date) {
    query = query.where('orders.created_at', '>=', start_date)
  }
  if (end_date) {
    query = query.where('orders.created_at', '<=', end_date)
  }
  if (product_name) {
    query = query.join('order_items', 'order_items.order_id', 'orders.id').join('products', 'order_items.product_id', 'products.id').where('products.name', 'like', `%${product_name}%`)
  }
  if (customer_name) {
    query = query.whereRaw("CONCAT(customers.first_name, ' ', customers.last_name) LIKE ?", [`%${customer_name}%`])
  }

  // Execute the query to get vendor orders
  const vendorOrders = await query

  // Extract all relevant order IDs
  const orderIds = vendorOrders.map(v => v.order_id)

  // Fetch order items belonging to this vendor's products only
  const items = await knex('order_items').whereIn('order_items.order_id', orderIds).join('products', 'order_items.product_id', 'products.id').where('products.vendor_id', vendorId).select('order_items.order_id', 'order_items.product_id', 'products.name as product_name', 'order_items.quantity', 'order_items.price')

  // Group items under their respective orders
  const grouped = vendorOrders.map(order => {
    const orderItems = items.filter(i => i.order_id === order.order_id)
    return {
      ...order,
      items: orderItems
    }
  })

  // Respond with grouped vendor orders
  res.status(200).json(grouped)
}

const updateVendorOrderStatus = async (req, res) => {
  // Check if the user is a vendor
  if (req.user?.type !== 'vendor') {
    return res.status(403).json({ error: 'Access denied: Vendors only' })
  }

  const { error, value } = updateVendorOrderStatusSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const vendorId = req.user.id
  const { id } = req.params // vendor_order ID

  // Validate vendor_order ID
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID Format' })
  }

  const { status, tracking_number } = value

  // Make sure the vendor owns the order
  const vendorOrder = await knex('vendor_orders').where({ id, vendor_id: vendorId }).first()

  if (!vendorOrder) {
    return res.status(404).json({ error: 'Order not found or not owned by vendor' })
  }

  // Check if the status is being changed to the same value
  if (vendorOrder.status === status) {
    return res.status(400).json({ error: `Order is already ${status}` })
  }

  const updates = {
    status,
    tracking_number,
    updated_at: knex.fn.now()
  }

  // If status is shipped or delivered, update the corresponding timestamp
  if (status === 'shipped') updates.shipped_at = knex.fn.now()
  if (status === 'delivered') updates.delivered_at = knex.fn.now()

  await knex('vendor_orders').where({ id }).update(updates)

  res.status(200).json({ message: 'Vendor order updated successfully' })
}

module.exports = { getVendorOrders, updateVendorOrderStatus }
