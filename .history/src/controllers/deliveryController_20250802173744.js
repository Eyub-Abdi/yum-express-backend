// controllers/deliveryController.js
const { calculateDeliveryFee } = require('../utils/distance')
const knex = require('../db/knex')

const estimateDeliveryFee = async (req, res) => {
  const { fromLat, fromLng, vendor_id } = req.body

  if (!fromLat || !fromLng || !vendor_id) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const vendor = await knex('vendors').where({ id: vendor_id }).first()

    if (!vendor || !vendor.lat || !vendor.lng) {
      return res.status(404).json({ error: 'Vendor not found or missing location data' })
    }

    const { fee, distanceInKm } = calculateDeliveryFee(Number(fromLat), Number(fromLng), Number(vendor.lat), Number(vendor.lng))

    res.json({
      distance: `${distanceInKm.toFixed(2)} km`,
      fee
    })
  } catch (error) {
    console.error('Error calculating fee:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

const getAvailableDeliveries = async (req, res) => {
  const { page = 1, limit = 10, start_date, end_date } = req.query
  const offset = (page - 1) * limit

  const deliveries = await knex('deliveries as d')
    .select('d.id as delivery_id', 'd.status as delivery_status', 'd.estimated_time', 'd.phone as delivery_phone', 'd.address as delivery_address', 'd.delivery_notes', 'd.delivered_at', 'd.delivery_fee', 'd.distance_km', 'o.id as order_id', 'o.total_price', 'o.order_status', 'o.payment_status', 'c.id as customer_id', 'c.first_name as customer_first_name', 'c.last_name as customer_last_name', 'c.phone as customer_phone', 'c.email as customer_email', 'v.id as vendor_id', 'v.business_name as vendor_business_name', 'v.phone as vendor_phone', 'v.address as vendor_address')
    .join('orders as o', 'd.order_id', 'o.id')
    .join('customers as c', 'd.customer_id', 'c.id')
    .join('vendors as v', 'd.vendor_id', 'v.id')
    .whereNull('d.assigned_to') // unassigned deliveries
    .where('d.status', 'pending') // or your active status
    .modify(qb => {
      if (start_date && end_date) {
        qb.whereBetween('d.created_at', [new Date(start_date), new Date(end_date)])
      }
    })
    .orderBy('d.estimated_time', 'asc')
    .limit(limit)
    .offset(offset)

  const orderIds = deliveries.map(d => d.order_id)

  const orderItems = await knex('order_items').join('products', 'order_items.product_id', 'products.id').whereIn('order_items.order_id', orderIds).select('order_items.order_id', 'products.id as product_id', 'products.name as product_name', 'products.image_url', 'order_items.quantity', 'order_items.price')

  const itemsByOrder = {}
  for (const item of orderItems) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id].push({
      product_id: item.product_id,
      name: item.product_name,
      image_url: item.image_url,
      quantity: item.quantity,
      price: item.price
    })
  }

  const enrichedDeliveries = deliveries.map(d => ({
    delivery_id: d.delivery_id,
    status: d.delivery_status,
    estimated_time: d.estimated_time,
    phone: d.delivery_phone,
    address: d.delivery_address,
    delivery_notes: d.delivery_notes,
    delivered_at: d.delivered_at,
    delivery_fee: d.delivery_fee,
    distance_km: d.distance_km,
    order: {
      id: d.order_id,
      total_price: d.total_price,
      order_status: d.order_status,
      payment_status: d.payment_status,
      items: itemsByOrder[d.order_id] || []
    },
    customer: {
      id: d.customer_id,
      first_name: d.customer_first_name,
      last_name: d.customer_last_name,
      phone: d.customer_phone,
      email: d.customer_email
    },
    vendor: {
      id: d.vendor_id,
      business_name: d.vendor_business_name,
      phone: d.vendor_phone,
      address: d.vendor_address
    }
  }))

  res.json({
    page: Number(page),
    limit: Number(limit),
    total: enrichedDeliveries.length,
    data: enrichedDeliveries
  })
}

const pickDelivery = async (req, res) => {
  const riderId = req.user.id // authenticated rider/driver id
  const { deliveryId } = req.params // delivery id from route param

  // Validate deliveryId (simple integer check, customize as needed)
  if (!deliveryId || isNaN(Number(deliveryId))) {
    return res.status(400).json({ message: 'Invalid delivery ID' })
  }

  // Update delivery only if it's unassigned and pending
  const updated = await knex('deliveries')
    .where({ id: deliveryId, assigned_to: null, status: 'pending' })
    .update({
      assigned_to: riderId,
      status: 'on_the_way',
      updated_at: knex.fn.now()
    })
    .returning('*')

  if (updated.length === 0) {
    return res.status(404).json({ message: 'Delivery not found or already assigned' })
  }

  res.json({ message: 'Delivery successfully picked', delivery: updated[0] })
}

module.exports = { estimateDeliveryFee, getAvailableDeliveries, pickDelivery }
