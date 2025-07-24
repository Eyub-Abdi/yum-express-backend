const knex = require('../db/knex')
const { getVendorOrdersSchema, updateVendorOrderStatusSchema } = require('../schemas/vendorOrderSchema')
const { assignDriverSchema } = require('../schemas/deliverySchema')

const { validateId } = require('../utils/validateId')

// const getVendorOrders = async (req, res) => {
//   // Allow access only if the authenticated user is a vendor
//   if (req.user?.type !== 'vendor') {
//     return res.status(403).json({ error: 'Access denied: Vendors only' })
//   }

//   // Validate query parameters using Joi schema
//   const { error, value } = getVendorOrdersSchema.validate(req.query)
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message })
//   }

//   const vendorId = req.user.id

//   // Destructure filter options from validated query parameters
//   const { status, start_date, end_date, product_name, customer_name } = value

//   // Build the query for vendor orders
//   let query = knex('vendor_orders').where('vendor_orders.vendor_id', vendorId).join('orders', 'vendor_orders.order_id', 'orders.id').join('customers', 'orders.customer_id', 'customers.id').select('vendor_orders.id as vendor_order_id', 'vendor_orders.status as vendor_order_status', 'vendor_orders.tracking_number', 'vendor_orders.shipped_at', 'vendor_orders.delivered_at', 'vendor_orders.vendor_price', 'orders.id as order_id', 'orders.created_at as order_created_at', 'customers.id as customer_id', knex.raw("CONCAT(customers.first_name, ' ', customers.last_name) as customer_name"), 'customers.phone as customer_phone')

//   // Apply filters based on query parameters
//   if (status) {
//     query = query.where('vendor_orders.status', status)
//   }
//   if (start_date) {
//     query = query.where('orders.created_at', '>=', start_date)
//   }
//   if (end_date) {
//     query = query.where('orders.created_at', '<=', end_date)
//   }
//   if (product_name) {
//     query = query.join('order_items', 'order_items.order_id', 'orders.id').join('products', 'order_items.product_id', 'products.id').where('products.name', 'like', `%${product_name}%`)
//   }
//   if (customer_name) {
//     query = query.whereRaw("CONCAT(customers.first_name, ' ', customers.last_name) LIKE ?", [`%${customer_name}%`])
//   }

//   // Execute the query to get vendor orders
//   const vendorOrders = await query

//   // Extract all relevant order IDs
//   const orderIds = vendorOrders.map(v => v.order_id)

//   // Fetch order items belonging to this vendor's products only
//   const items = await knex('order_items').whereIn('order_items.order_id', orderIds).join('products', 'order_items.product_id', 'products.id').where('products.vendor_id', vendorId).select('order_items.order_id', 'order_items.product_id', 'products.name as product_name', 'order_items.quantity', 'order_items.price')

//   // Group items under their respective orders
//   const grouped = vendorOrders.map(order => {
//     const orderItems = items.filter(i => i.order_id === order.order_id)
//     return {
//       ...order,
//       items: orderItems
//     }
//   })

//   // Respond with grouped vendor orders
//   res.status(200).json(grouped)
// }

const getVendorOrders = async (req, res) => {
  if (req.user?.type !== 'vendor') {
    return res.status(403).json({ error: 'Access denied: Vendors only' })
  }

  const { error, value } = getVendorOrdersSchema.validate(req.query)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const vendorId = req.user.id
  const { status, start_date, end_date, product_name, customer_name } = value

  // Start query from orders table, filtered by vendor_id
  let query = knex('orders').where('orders.vendor_id', vendorId).join('customers', 'orders.customer_id', 'customers.id').select('orders.id as order_id', 'orders.order_status', 'orders.payment_status', 'orders.total_price', 'orders.created_at as order_created_at', 'customers.id as customer_id', knex.raw("CONCAT(customers.first_name, ' ', customers.last_name) as customer_name"), 'customers.phone as customer_phone')

  if (status) {
    query = query.where('orders.order_status', status)
  }
  if (start_date) {
    query = query.where('orders.created_at', '>=', start_date)
  }
  if (end_date) {
    query = query.where('orders.created_at', '<=', end_date)
  }
  if (customer_name) {
    query = query.whereRaw("CONCAT(customers.first_name, ' ', customers.last_name) ILIKE ?", [`%${customer_name}%`])
  }

  const vendorOrders = await query
  const orderIds = vendorOrders.map(order => order.order_id)

  // Now fetch relevant order items and filter by this vendor's products
  let itemQuery = knex('order_items').whereIn('order_items.order_id', orderIds).join('products', 'order_items.product_id', 'products.id').where('products.vendor_id', vendorId).select('order_items.order_id', 'order_items.product_id', 'products.name as product_name', 'order_items.quantity', 'order_items.price', 'products.image_url as image_url')

  if (product_name) {
    itemQuery = itemQuery.where('products.name', 'ilike', `%${product_name}%`)
  }

  const items = await itemQuery

  // Attach items to the corresponding orders
  // const grouped = vendorOrders.map(order => ({
  //   ...order,
  //   items: items.filter(item => item.order_id === order.order_id)
  // }))

  // res.status(200).json(grouped)

  const grouped = vendorOrders.map(order => {
    const orderItems = items.filter(item => item.order_id === order.order_id)
    const recalculatedTotal = orderItems.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity
    }, 0)

    return {
      ...order,
      total_price: recalculatedTotal, // override DB value
      items: orderItems
    }
  })
  res.status(200).json(grouped)
}

const assignDriverToDelivery = async (req, res) => {
  const { error, value } = assignDriverSchema.validate(req.body)
  if (error) {
    console.log('Validation Error:', error.details) // 👈 Add this line

    return res.status(400).json({ error: error.details[0].message })
  }

  const { order_id, driver_id } = value
  const vendorId = req.user.id // shelf user
  console.log('Vendor ID from token:', vendorId)

  // Find the delivery that matches this order and vendor
  const delivery = await knex('deliveries').where({ order_id, vendor_id: vendorId }).first()

  if (!delivery) {
    return res.status(404).json({ message: 'Delivery not found for this order and vendor' })
  }

  // Assign the driver
  await knex('deliveries').where({ id: delivery.id }).update({
    assigned_to: driver_id,
    updated_at: new Date()
  })

  return res.json({ message: 'Driver assigned successfully', delivery_id: delivery.id })
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
  if (status === 'on_the_way') updates.shipped_at = knex.fn.now()
  if (status === 'delivered') updates.delivered_at = knex.fn.now()

  await knex('orders').where({ id }).update(updates)

  res.status(200).json({ message: 'Vendor order updated successfully' })
}
const acceptVendorOrder = async (req, res) => {
  const vendorId = req.user.id
  const { id } = req.params

  // Optional: Validate order ID
  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid order ID format' })
  }

  // Make sure the vendor owns this order
  const order = await knex('orders').where({ id, vendor_id: vendorId }).first()

  if (!order) {
    return res.status(404).json({ error: 'Order not found or not owned by vendor' })
  }

  if (order.order_status === 'processing') {
    return res.status(400).json({ error: 'Order is already accepted' })
  }

  // Update the order status
  await knex('orders').where({ id }).update({
    order_status: 'processing', // or 'on_the_way', etc.
    updated_at: knex.fn.now()
  })

  return res.json({ message: 'Order accepted successfully' })
}
const getCustomerOrderHistory = async (req, res) => {
  const customerId = req.user.id

  const orders = await knex('orders as o')
    .join('order_items as oi', 'o.id', 'oi.order_id')
    .join('products as p', 'oi.product_id', 'p.id')
    .leftJoin('deliveries as d', 'o.id', 'd.order_id')
    .select(
      'o.id as order_id',
      'o.total_price',
      'o.order_status',
      'o.payment_status',
      'o.created_at as order_created_at',

      'oi.quantity',
      'oi.price as item_price',

      'p.name as product_name',
      'p.image_url',

      'd.status as delivery_status',
      'd.delivered_at'
    )
    .where('o.customer_id', customerId)
    .orderBy('o.created_at', 'desc')

  const grouped = orders.reduce((acc, row) => {
    const orderId = row.order_id
    if (!acc[orderId]) {
      acc[orderId] = {
        order_id: row.order_id,
        total_price: row.total_price,
        order_status: row.order_status,
        payment_status: row.payment_status,
        order_created_at: row.order_created_at,
        delivery_status: row.delivery_status,
        delivered_at: row.delivered_at,
        items: []
      }
    }

    acc[orderId].items.push({
      product_name: row.product_name,
      image_url: row.image_url,
      quantity: row.quantity,
      price: row.item_price
    })

    return acc
  }, {})

  res.json(Object.values(grouped))
}

module.exports = { getVendorOrders, updateVendorOrderStatus, assignDriverToDelivery, acceptVendorOrder }
