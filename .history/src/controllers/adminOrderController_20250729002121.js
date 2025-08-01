const knex = require('../db/knex')
const { validateId } = require('../utils/validateId')
const { getAllOrdersQuerySchema } = require('../schemas/adminOrderSchema')
const { updateVendorOrderStatusSchema } = require('../schemas/vendorOrderSchema')

// const getAllOrders = async (req, res) => {
//   const { error, value } = getAllOrdersQuerySchema.validate(req.query)

//   if (error) {
//     return res.status(400).json({ message: error.details[0].message })
//   }

//   const { page, limit, status, customer_id, vendor_id, sort_by, sort_order, start_date, end_date } = value
//   const offset = (page - 1) * limit

//   const ordersQuery = knex('orders')
//     .select('orders.*', 'customers.first_name as customer_first_name', 'customers.last_name as customer_last_name', 'customers.phone as customer_phone', 'vendors.business_name as vendor_business_name')
//     .leftJoin('customers', 'orders.customer_id', 'customers.id')
//     .leftJoin('vendors', 'orders.vendor_id', 'vendors.id')
//     .modify(qb => {
//       if (status) qb.where('orders.order_status', status)
//       if (customer_id && validateId(customer_id)) qb.where('orders.customer_id', customer_id)
//       if (start_date && end_date) {
//         qb.whereBetween('orders.created_at', [new Date(start_date), new Date(end_date)])
//       }
//       if (vendor_id && validateId(vendor_id)) {
//         qb.join('order_items', 'orders.id', 'order_items.order_id').join('products', 'order_items.product_id', 'products.id').where('products.vendor_id', vendor_id).groupBy('orders.id', 'customers.first_name', 'customers.last_name', 'customers.phone', 'vendors.business_name')
//       } else {
//         qb.groupBy('orders.id', 'customers.first_name', 'customers.last_name', 'customers.phone', 'vendors.business_name')
//       }
//     })
//     .orderBy(sort_by || 'orders.created_at', sort_order || 'desc')
//     .limit(limit)
//     .offset(offset)

//   const orders = await ordersQuery
//   const orderIds = orders.map(order => order.id)

//   const orderItems = await knex('order_items').join('products', 'order_items.product_id', 'products.id').whereIn('order_items.order_id', orderIds).select('order_items.order_id', 'products.id as product_id', 'products.name as product_name', 'products.image_url', 'order_items.quantity', 'order_items.price')

//   const itemsByOrder = {}
//   const totalsByOrder = {}

//   for (const item of orderItems) {
//     if (!itemsByOrder[item.order_id]) {
//       itemsByOrder[item.order_id] = []
//       totalsByOrder[item.order_id] = 0
//     }

//     itemsByOrder[item.order_id].push({
//       product_id: item.product_id,
//       name: item.product_name,
//       image_url: item.image_url,
//       quantity: item.quantity,
//       price: item.price
//     })

//     totalsByOrder[item.order_id] += Number(item.price) * item.quantity
//   }

//   const deliveries = await knex('deliveries').whereIn('order_id', orderIds).select('order_id', 'status', 'estimated_time', 'phone', 'address', 'delivered_at', 'assigned_to', 'delivery_notes')

//   // Get list of driver IDs to fetch driver info
//   const driverIds = deliveries.map(d => d.assigned_to).filter(Boolean)

//   let driverMap = {}
//   if (driverIds.length) {
//     const drivers = await knex('drivers').whereIn('id', driverIds).select('id', 'first_name', 'last_name', 'phone')

//     driverMap = drivers.reduce((acc, driver) => {
//       acc[driver.id] = {
//         id: driver.id,
//         first_name: driver.first_name,
//         last_name: driver.last_name,
//         phone: driver.phone
//       }
//       return acc
//     }, {})
//   }

//   const deliveryMap = {}
//   for (const delivery of deliveries) {
//     deliveryMap[delivery.order_id] = {
//       status: delivery.status,
//       estimated_time: delivery.estimated_time,
//       phone: delivery.phone,
//       address: delivery.address,
//       delivered_at: delivery.delivered_at,
//       delivery_notes: delivery.delivery_notes || null,
//       assigned_to: delivery.assigned_to || null,
//       driver: delivery.assigned_to ? driverMap[delivery.assigned_to] || null : null
//     }
//   }

//   const enrichedOrders = orders.map(order => ({
//     id: order.id,
//     customer: {
//       id: order.customer_id,
//       first_name: order.customer_first_name,
//       last_name: order.customer_last_name,
//       phone: order.customer_phone
//     },
//     vendor: {
//       id: order.vendor_id,
//       business_name: order.vendor_business_name
//     },
//     order_status: order.order_status,
//     payment_status: order.payment_status,
//     created_at: order.created_at,
//     total_price: totalsByOrder[order.id] || 0,
//     items: itemsByOrder[order.id] || [],
//     delivery: deliveryMap[order.id] || null
//   }))

//   res.json({
//     page,
//     limit,
//     total: enrichedOrders.length,
//     data: enrichedOrders
//   })
// }

const getAllOrders = async (req, res) => {
  const { error, value } = getAllOrdersQuerySchema.validate(req.query)

  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { page, limit, status, customer_id, vendor_id, sort_by, sort_order, start_date, end_date } = value

  const offset = (page - 1) * limit

  const ordersQuery = knex('orders')
    .select(
      'orders.*',
      'customers.first_name as customer_first_name',
      'customers.last_name as customer_last_name',
      'customers.phone as customer_phone',
      'vendors.business_name as vendor_business_name',
      'payments.payment_method' // ✅ Include payment method
    )
    .leftJoin('customers', 'orders.customer_id', 'customers.id')
    .leftJoin('vendors', 'orders.vendor_id', 'vendors.id')
    .leftJoin('payments', 'orders.id', 'payments.order_id') // ✅ Join payments
    .modify(qb => {
      if (status) qb.where('orders.order_status', status)
      if (customer_id && validateId(customer_id)) qb.where('orders.customer_id', customer_id)
      if (start_date && end_date) {
        qb.whereBetween('orders.created_at', [new Date(start_date), new Date(end_date)])
      }
      if (vendor_id && validateId(vendor_id)) {
        qb.join('order_items', 'orders.id', 'order_items.order_id').join('products', 'order_items.product_id', 'products.id').where('products.vendor_id', vendor_id).groupBy('orders.id', 'customers.first_name', 'customers.last_name', 'customers.phone', 'vendors.business_name', 'payments.payment_method')
      } else {
        qb.groupBy('orders.id', 'customers.first_name', 'customers.last_name', 'customers.phone', 'vendors.business_name', 'payments.payment_method')
      }
    })
    .orderBy(sort_by || 'orders.created_at', sort_order || 'desc')
    .limit(limit)
    .offset(offset)

  const orders = await ordersQuery
  const orderIds = orders.map(order => order.id)

  const orderItems = await knex('order_items').join('products', 'order_items.product_id', 'products.id').whereIn('order_items.order_id', orderIds).select('order_items.order_id', 'products.id as product_id', 'products.name as product_name', 'products.image_url', 'order_items.quantity', 'order_items.price')

  const itemsByOrder = {}
  const totalsByOrder = {}

  for (const item of orderItems) {
    if (!itemsByOrder[item.order_id]) {
      itemsByOrder[item.order_id] = []
      totalsByOrder[item.order_id] = 0
    }

    itemsByOrder[item.order_id].push({
      product_id: item.product_id,
      name: item.product_name,
      image_url: item.image_url,
      quantity: item.quantity,
      price: item.price
    })

    totalsByOrder[item.order_id] += Number(item.price) * item.quantity
  }

  const deliveries = await knex('deliveries').whereIn('order_id', orderIds).select('order_id', 'status', 'estimated_time', 'phone', 'address', 'delivered_at', 'assigned_to', 'delivery_notes')

  const driverIds = deliveries.map(d => d.assigned_to).filter(Boolean)

  let driverMap = {}
  if (driverIds.length) {
    const drivers = await knex('drivers').whereIn('id', driverIds).select('id', 'first_name', 'last_name', 'phone')

    driverMap = drivers.reduce((acc, driver) => {
      acc[driver.id] = {
        id: driver.id,
        first_name: driver.first_name,
        last_name: driver.last_name,
        phone: driver.phone
      }
      return acc
    }, {})
  }

  const deliveryMap = {}
  for (const delivery of deliveries) {
    deliveryMap[delivery.order_id] = {
      status: delivery.status,
      estimated_time: delivery.estimated_time,
      phone: delivery.phone,
      address: delivery.address,
      delivered_at: delivery.delivered_at,
      delivery_notes: delivery.delivery_notes || null,
      assigned_to: delivery.assigned_to || null,
      driver: delivery.assigned_to ? driverMap[delivery.assigned_to] || null : null
    }
  }

  const enrichedOrders = orders.map(order => ({
    id: order.id,
    customer: {
      id: order.customer_id,
      first_name: order.customer_first_name,
      last_name: order.customer_last_name,
      phone: order.customer_phone
    },
    vendor: {
      id: order.vendor_id,
      business_name: order.vendor_business_name
    },
    order_status: order.order_status,
    payment_status: order.payment_status,
    payment_method: order.payment_method || null,
    created_at: order.created_at,
    total_price: totalsByOrder[order.id] || 0,
    items: itemsByOrder[order.id] || [],
    delivery: deliveryMap[order.id] || null
  }))

  res.json({
    page,
    limit,
    total: enrichedOrders.length,
    data: enrichedOrders
  })
}

const updateStatus = async (req, res) => {
  const { error, value } = updateVendorOrderStatusSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { order_id, status } = value

  // Fetch order
  const order = await knex('orders').where({ id: order_id }).first()
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }

  // Check if status is already set
  if (order.order_status === status) {
    return res.status(400).json({ error: `Order is already ${status}` })
  }

  // Fetch related delivery
  const delivery = await knex('deliveries').where({ order_id }).first()

  if (!delivery) {
    return res.status(404).json({ error: 'Related delivery record not found' })
  }

  // If delivery has no assigned driver, only allow setting status to "processing"
  if (!delivery.assigned_to && status !== 'processing') {
    return res.status(400).json({
      error: 'Cannot change status until a delivery rider is assigned'
    })
  }

  // Update orders table
  const updates = {
    order_status: status,
    updated_at: knex.fn.now()
  }

  await knex('orders').where({ id: order_id }).update(updates)

  // Update delivered_at only if status is delivered
  if (status === 'delivered') {
    await knex('deliveries').where({ order_id }).update({ delivered_at: knex.fn.now() })
  }

  return res.status(200).json({ message: `Status changed to ${status}` })
}

module.exports = { getAllOrders, updateStatus }
