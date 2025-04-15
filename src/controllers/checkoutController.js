const knex = require('../db/knex')
const { checkoutSchema } = require('../schemas/checkoutSchema')
const { processPayment } = require('../services/paymentService')

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
  const items = await knex('cart_items').where({ cart_id }).join('products', 'cart_items.product_id', 'products.id').select('cart_items.product_id', 'cart_items.quantity', 'products.price', 'products.name', 'products.vendor_id')

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
        vendor_id: items[0].vendor_id, // Single vendor for the cart
        total_price: totalPrice,
        payment_status: 'pending',
        order_status: 'processing',
        created_at: knex.fn.now()
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
      throw new Error('Payment failed')
    }
  } catch (err) {
    await trx.rollback()
    throw err // Let the global error handler catch and log this error
  }
}

module.exports = { checkoutCart }
