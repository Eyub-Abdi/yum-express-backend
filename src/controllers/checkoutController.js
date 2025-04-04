const knex = require('../db/knex')
const { checkoutSchema } = require('../schemas/checkoutSchema')
const { processPayment } = require('../services/paymentService')

const checkoutCart = async (req, res) => {
  const { error } = checkoutSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { cart_id } = req.body

  const cart = await knex('carts').where({ id: cart_id }).first()
  if (!cart) return res.status(404).json({ error: 'Cart not found' })

  // Make sure the user owns the cart
  if (cart.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized access to this cart' })
  }

  const items = await knex('cart_items').where({ cart_id }).join('products', 'cart_items.product_id', 'products.id').select('cart_items.product_id', 'cart_items.quantity', 'products.stock', 'products.price', 'products.name')

  if (!items.length) {
    return res.status(400).json({ error: 'Cart is empty' })
  }

  for (const item of items) {
    if (item.quantity > item.stock) {
      return res.status(400).json({
        error: `Not enough stock for ${item.name}. Available: ${item.stock}`
      })
    }
  }

  const trx = await knex.transaction()

  try {
    const totalPrice = items.reduce((sum, i) => sum + i.quantity * parseFloat(i.price), 0)

    const [order] = await trx('orders')
      .insert({
        customer_id: cart.customer_id,
        total_price: totalPrice,
        status: 'pending',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*')

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: knex.fn.now()
    }))
    await trx('order_items').insert(orderItems)

    // Call payment service BEFORE committing
    const paymentResult = await processPayment(totalPrice, cart.customer_id)

    if (paymentResult.success) {
      await trx('payments').insert({
        order_id: order.id,
        amount: totalPrice,
        payment_method: paymentResult.payment_method,
        status: 'Completed',
        transaction_id: paymentResult.transaction_id,
        created_at: knex.fn.now()
      })

      await trx('orders').where({ id: order.id }).update({ status: 'paid', updated_at: knex.fn.now() })

      for (const item of items) {
        await trx('products').where({ id: item.product_id }).decrement('stock', item.quantity)
      }

      await trx('cart_items').where({ cart_id }).del()
      await trx('carts').where({ id: cart_id }).del()

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
