const knex = require('../db/knex')
const { checkoutSchema } = require('../schemas/checkoutSchema')
const { processPayment } = require('../services/paymentService')

// Helper to get current week number (used for vendor payment tracking)
Date.prototype.getWeek = function () {
  const onejan = new Date(this.getFullYear(), 0, 1)
  const today = new Date(this.getFullYear(), this.getMonth(), this.getDate())
  const dayOfYear = Math.floor((today - onejan + 86400000) / 86400000)
  return Math.ceil(dayOfYear / 7)
}

const checkoutCart = async (req, res) => {
  // Validate request body
  const { error } = checkoutSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { cart_id } = req.body

  // Check if cart exists
  const cart = await knex('carts').where({ id: cart_id }).first()
  if (!cart) return res.status(404).json({ error: 'Cart not found' })

  // Ensure the user owns the cart
  if (cart.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized access to this cart' })
  }

  // Get cart items with product info
  const items = await knex('cart_items').where({ cart_id }).join('products', 'cart_items.product_id', 'products.id').select(
    'cart_items.product_id',
    'cart_items.quantity',
    'products.stock',
    'products.price',
    'products.name',
    'products.vendor_id' // Needed for vendor_orders
  )

  if (!items.length) {
    return res.status(400).json({ error: 'Cart is empty' })
  }

  // Check stock for each product
  for (const item of items) {
    if (item.quantity > item.stock) {
      return res.status(400).json({
        error: `Not enough stock for ${item.name}. Available: ${item.stock}`
      })
    }
  }

  const trx = await knex.transaction()

  try {
    // Calculate total cart price
    const totalPrice = items.reduce((sum, i) => sum + i.quantity * parseFloat(i.price), 0)

    // Create main order
    const [order] = await trx('orders')
      .insert({
        customer_id: cart.customer_id,
        total_price: totalPrice,
        payment_status: 'pending', // Set payment_status to 'pending'
        order_status: 'processing', // Set order_status to 'processing'
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*')

    // Create order_items for each cart item
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: knex.fn.now()
    }))
    await trx('order_items').insert(orderItems)

    // Group items by vendor to prepare vendor_orders
    const vendorTotals = {}
    for (const item of items) {
      const vendorId = item.vendor_id
      const itemTotal = item.price * item.quantity
      vendorTotals[vendorId] = (vendorTotals[vendorId] || 0) + itemTotal
    }

    // Insert into vendor_orders table for each vendor
    const currentWeek = new Date().getWeek()
    for (const [vendorId, vendorPrice] of Object.entries(vendorTotals)) {
      await trx('vendor_orders').insert({
        order_id: order.id,
        vendor_id: vendorId,
        vendor_price: vendorPrice,
        payment_week: currentWeek,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
    }

    // Process payment before committing
    const paymentResult = await processPayment(totalPrice, cart.customer_id)

    if (paymentResult.success) {
      // Record payment
      await trx('payments').insert({
        order_id: order.id,
        amount: totalPrice,
        payment_method: paymentResult.payment_method,
        status: 'Completed',
        transaction_id: paymentResult.transaction_id,
        created_at: knex.fn.now()
      })

      // Update order status to paid
      await trx('orders').where({ id: order.id }).update({
        payment_status: 'paid',
        updated_at: knex.fn.now()
      })

      // Update product stock
      for (const item of items) {
        await trx('products').where({ id: item.product_id }).decrement('stock', item.quantity)
      }

      // Clean up cart and items
      await trx('cart_items').where({ cart_id }).del()
      await trx('carts').where({ id: cart_id }).del()

      // Commit transaction
      await trx.commit()

      return res.status(200).json({
        message: 'Checkout successful and payment processed',
        order_id: order.id,
        total: totalPrice
      })
    } else {
      await trx.rollback()
      return res.status(500).json({ error: 'Payment failed' })
    }
  } catch (err) {
    await trx.rollback()
    return res.status(500).json({ error: 'Checkout failed', details: err.message })
  }
}

module.exports = { checkoutCart }
