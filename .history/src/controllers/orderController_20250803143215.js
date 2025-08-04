const knex = require('../db/knex')
const { getVendorOrdersSchema, rejectSchema, updateVendorOrderStatusSchema } = require('../schemas/vendorOrderSchema')
const { assignDriverSchema } = require('../schemas/deliverySchema')
const { sendEmail } = require('../services/emailService')
const { validateId } = require('../utils/validateId')

// const getVendorOrders = async (req, res) => {
//   if (req.user?.type !== 'vendor') {
//     return res.status(403).json({ error: 'Access denied: Vendors only' })
//   }

//   const { error, value } = getVendorOrdersSchema.validate(req.query)
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message })
//   }

//   const vendorId = req.user.id
//   const { status, start_date, end_date, product_name, customer_name } = value

//   // Start query from orders table, filtered by vendor_id
//   let query = knex('orders').where('orders.vendor_id', vendorId).join('customers', 'orders.customer_id', 'customers.id').select('orders.id as order_id', 'orders.order_status', 'orders.payment_status', 'orders.total_price', 'orders.created_at as order_created_at', 'customers.id as customer_id', knex.raw("CONCAT(customers.first_name, ' ', customers.last_name) as customer_name"), 'customers.phone as customer_phone')

//   if (status) {
//     query = query.where('orders.order_status', status)
//   }
//   if (start_date) {
//     query = query.where('orders.created_at', '>=', start_date)
//   }
//   if (end_date) {
//     query = query.where('orders.created_at', '<=', end_date)
//   }
//   if (customer_name) {
//     query = query.whereRaw("CONCAT(customers.first_name, ' ', customers.last_name) ILIKE ?", [`%${customer_name}%`])
//   }

//   const vendorOrders = await query
//   const orderIds = vendorOrders.map(order => order.order_id)

//   // Now fetch relevant order items and filter by this vendor's products
//   let itemQuery = knex('order_items').whereIn('order_items.order_id', orderIds).join('products', 'order_items.product_id', 'products.id').where('products.vendor_id', vendorId).select('order_items.order_id', 'order_items.product_id', 'products.name as product_name', 'order_items.quantity', 'order_items.price', 'products.image_url as image_url')

//   if (product_name) {
//     itemQuery = itemQuery.where('products.name', 'ilike', `%${product_name}%`)
//   }

//   const items = await itemQuery

//   // Attach items to the corresponding orders
//   // const grouped = vendorOrders.map(order => ({
//   //   ...order,
//   //   items: items.filter(item => item.order_id === order.order_id)
//   // }))

//   // res.status(200).json(grouped)

//   const grouped = vendorOrders.map(order => {
//     const orderItems = items.filter(item => item.order_id === order.order_id)
//     const recalculatedTotal = orderItems.reduce((sum, item) => {
//       return sum + Number(item.price) * item.quantity
//     }, 0)

//     return {
//       ...order,
//       total_price: recalculatedTotal, // override DB value
//       items: orderItems
//     }
//   })
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

  // Start query from orders table, now also join with payments
  let query = knex('orders')
    .where('orders.vendor_id', vendorId)
    .join('customers', 'orders.customer_id', 'customers.id')
    .leftJoin('payments', 'orders.id', 'payments.order_id') // Join payments to get payment_method
    .select(
      'orders.id as order_id',
      'orders.order_status',
      'orders.payment_status',
      'orders.total_price',
      'orders.created_at as order_created_at',
      'customers.id as customer_id',
      knex.raw("CONCAT(customers.first_name, ' ', customers.last_name) as customer_name"),
      'customers.phone as customer_phone',
      'payments.payment_method' // SELECT payment method
    )

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

  let itemQuery = knex('order_items').whereIn('order_items.order_id', orderIds).join('products', 'order_items.product_id', 'products.id').where('products.vendor_id', vendorId).select('order_items.order_id', 'order_items.product_id', 'products.name as product_name', 'order_items.quantity', 'order_items.price', 'products.image_url as image_url')

  if (product_name) {
    itemQuery = itemQuery.where('products.name', 'ilike', `%${product_name}%`)
  }

  const items = await itemQuery

  const grouped = vendorOrders.map(order => {
    const orderItems = items.filter(item => item.order_id === order.order_id)
    const recalculatedTotal = orderItems.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity
    }, 0)

    return {
      ...order,
      total_price: recalculatedTotal,
      items: orderItems
    }
  })

  res.status(200).json(grouped)
}

const assignDriverToDelivery = async (req, res) => {
  const { error, value } = assignDriverSchema.validate(req.body)
  if (error) {
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
// const acceptVendorOrder = async (req, res) => {
//   const vendorId = req.user.id
//   const { id } = req.params

//   // Optional: Validate order ID
//   if (!validateId(id)) {
//     return res.status(400).json({ error: 'Invalid order ID format' })
//   }

//   // Make sure the vendor owns this order
//   const order = await knex('orders').where({ id, vendor_id: vendorId }).first()

//   if (!order) {
//     return res.status(404).json({ error: 'Order not found or not owned by vendor' })
//   }

//   if (order.order_status === 'processing') {
//     return res.status(400).json({ error: 'Order is already accepted' })
//   }

//   // Update the order status
//   await knex('orders').where({ id }).update({
//     order_status: 'processing', // or 'on_the_way', etc.
//     updated_at: knex.fn.now()
//   })

//   await sendEmail({
//     recipientEmail: ['ayubabdiy@gmail.com'],
//     firstName: 'Ayub',
//     type: 'info',
//     payload: {
//       subject: 'Your Order is Canceld',
//       title: 'Order Canceld',
//       message: 'Your order has been picked up by the rider and is on its way. You can expect it soon! Thank you for trusting us',
//       actionLink: 'https://yum-express.tz/track-order/123',
//       buttonText: 'Thanks for trusting us'
//     }
//   })

//   return res.json({ message: 'Order accepted successfully' })
// }

const acceptVendorOrder = async (req, res) => {
  const vendorId = req.user.id
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid order ID format' })
  }

  const order = await knex('orders').where({ id, vendor_id: vendorId }).first()
  if (!order) {
    return res.status(404).json({ error: 'Order not found or not owned by vendor' })
  }

  if (order.order_status === 'processing') {
    return res.status(400).json({ error: 'Order is already accepted' })
  }

  // Get vendor name
  const vendor = await knex('vendors').where({ id: vendorId }).first()

  await knex('orders').where({ id }).update({
    order_status: 'processing',
    updated_at: knex.fn.now()
  })

  await sendEmail({
    recipientEmail: ['ayubabdiy@gmail.com'], // Add more admins if needed
    firstName: 'Admin',
    type: 'info',
    payload: {
      subject: `Order #${order.order_number} Accepted`,
      title: 'Vendor Accepted an Order',
      message: `Order #${order.order_number} has been accepted by vendor **${vendor.business_name}**.`
      // If you don't want actionLink, omit it or make it optional in your email template logic
    }
  })

  return res.json({ message: 'Order accepted successfully' })
}

const rejectVendorOrder = async (req, res) => {
  const vendorId = req.user.id
  const { id } = req.params

  // Validate ID
  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid order ID format' })
  }

  // Validate reason using Joi
  const { error } = rejectSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { reason } = req.body

  // Ensure vendor owns this order
  const order = await knex('orders').where({ id, vendor_id: vendorId }).first()

  if (!order) {
    return res.status(404).json({ error: 'Order not found or not owned by vendor' })
  }

  if (order.order_status !== 'pending') {
    return res.status(400).json({ error: 'Only pending orders can be rejected' })
  }

  // Update the order status to rejected
  await knex('orders').where({ id }).update({
    order_status: 'rejected',
    rejection_reason: reason.trim(),
    rejected_at: knex.fn.now(),
    updated_at: knex.fn.now()
  })

  return res.json({ message: 'Order rejected successfully' })
}

// const getCustomerOrderHistory = async (req, res) => {
//   const customerId = req.user.id

//   const orders = await knex('orders as o').join('order_items as oi', 'o.id', 'oi.order_id').join('products as p', 'oi.product_id', 'p.id').leftJoin('deliveries as d', 'o.id', 'd.order_id').select('o.id as order_id', 'o.total_price', 'o.order_status', 'o.payment_status', 'o.created_at as order_created_at', 'oi.quantity', 'oi.price as item_price', 'p.name as product_name', 'p.image_url', 'd.status as delivery_status', 'd.delivered_at', 'd.confirmed_delivered').where('o.customer_id', customerId)

//   const groupedMap = new Map()

//   orders.forEach(row => {
//     const orderId = row.order_id

//     if (!groupedMap.has(orderId)) {
//       groupedMap.set(orderId, {
//         order_id: row.order_id,
//         total_price: row.total_price,
//         order_status: row.order_status,
//         payment_status: row.payment_status,
//         order_created_at: row.order_created_at,
//         delivery_status: row.delivery_status,
//         delivered_at: row.delivered_at,
//         confirmed_delivered: row.confirmed_delivered,
//         items: []
//       })
//     }

//     groupedMap.get(orderId).items.push({
//       product_name: row.product_name,
//       image_url: row.image_url,
//       quantity: row.quantity,
//       price: row.item_price
//     })
//   })

//   const sortedOrders = [...groupedMap.values()].sort((a, b) => {
//     const aDeliveredAndConfirmed = a.delivery_status === 'delivered' && a.confirmed_delivered === true
//     const bDeliveredAndConfirmed = b.delivery_status === 'delivered' && b.confirmed_delivered === true

//     // If only one is fully delivered and confirmed, put it after
//     if (aDeliveredAndConfirmed && !bDeliveredAndConfirmed) return 1
//     if (!aDeliveredAndConfirmed && bDeliveredAndConfirmed) return -1

//     // Otherwise, sort by newest first
//     return new Date(b.order_created_at) - new Date(a.order_created_at)
//   })

//   res.json(sortedOrders)
// }

const getCustomerOrderHistory = async (req, res) => {
  const customerId = req.user.id

  const orders = await knex('orders as o')
    .join('order_items as oi', 'o.id', 'oi.order_id')
    .join('products as p', 'oi.product_id', 'p.id')
    .leftJoin('deliveries as d', 'o.id', 'd.order_id')
    .leftJoin('drivers as drv', 'd.assigned_to', 'drv.id') // join with drivers
    .select('o.id as order_id', 'o.total_price', 'o.order_status', 'o.payment_status', 'o.created_at as order_created_at', 'oi.quantity', 'oi.price as item_price', 'p.name as product_name', 'p.image_url', 'd.status as delivery_status', 'd.delivered_at', 'd.confirmed_delivered', 'drv.first_name as driver_first_name', 'drv.last_name as driver_last_name', 'drv.phone as driver_phone')
    .where('o.customer_id', customerId)

  const groupedMap = new Map()

  orders.forEach(row => {
    const orderId = row.order_id

    if (!groupedMap.has(orderId)) {
      groupedMap.set(orderId, {
        order_id: row.order_id,
        total_price: row.total_price,
        order_status: row.order_status,
        payment_status: row.payment_status,
        order_created_at: row.order_created_at,
        delivery_status: row.delivery_status,
        delivered_at: row.delivered_at,
        confirmed_delivered: row.confirmed_delivered,
        driver: row.driver_first_name
          ? {
              first_name: row.driver_first_name,
              last_name: row.driver_last_name,
              phone: row.driver_phone
            }
          : null,
        items: []
      })
    }

    groupedMap.get(orderId).items.push({
      product_name: row.product_name,
      image_url: row.image_url,
      quantity: row.quantity,
      price: row.item_price
    })
  })

  const sortedOrders = [...groupedMap.values()].sort((a, b) => {
    const aDeliveredAndConfirmed = a.delivery_status === 'delivered' && a.confirmed_delivered === true
    const bDeliveredAndConfirmed = b.delivery_status === 'delivered' && b.confirmed_delivered === true

    if (aDeliveredAndConfirmed && !bDeliveredAndConfirmed) return 1
    if (!aDeliveredAndConfirmed && bDeliveredAndConfirmed) return -1

    return new Date(b.order_created_at) - new Date(a.order_created_at)
  })

  res.json(sortedOrders)
}

const confirmDelivery = async (req, res) => {
  const orderId = req.params.id
  const { confirmed_delivered } = req.body
  const userId = req.user.id

  // Validate input
  if (typeof confirmed_delivered !== 'boolean') {
    return res.status(400).json({ message: 'confirmed_delivered must be a boolean' })
  }

  // Validate order ID
  if (!validateId(orderId)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  // Find delivery by order_id
  const delivery = await knex('deliveries').where('order_id', orderId).first()

  if (!delivery) {
    return res.status(404).json({ message: 'Delivery not found' })
  }

  // Ensure this delivery belongs to the logged-in user
  if (delivery.customer_id !== userId) {
    return res.status(403).json({ message: 'You are not authorized to confirm this delivery' })
  }

  // Update confirmation
  await knex('deliveries').where('order_id', orderId).update({
    confirmed_delivered,
    updated_at: new Date()
  })

  res.json({ message: 'Delivery confirmed successfully' })
}

module.exports = { getVendorOrders, updateVendorOrderStatus, assignDriverToDelivery, getCustomerOrderHistory, acceptVendorOrder, rejectVendorOrder, confirmDelivery }
