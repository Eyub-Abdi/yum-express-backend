const knex = require('../db/knex')
const { createOrderAndRelated } = require('../services/checkoutService')

const clickPesaWebhookHandler = async (req, res) => {
  const payload = req.body
  const { event_type, status, transaction_id, reference, amount } = payload

  if (event_type !== 'payment.completed' || status !== 'completed') {
    return res.status(400).json({ message: 'Ignored event' })
  }

  const trx = await knex.transaction()

  try {
    const pending = await trx('pending_payments').where({ order_reference: reference }).first()
    if (!pending) return res.status(404).json({ message: 'Pending payment not found' })

    const cart = await trx('carts').where({ id: pending.cart_id }).first()
    const items = await trx('cart_items').where({ cart_id: cart.id }).join('products', 'cart_items.product_id', 'products.id')

    const deliveryData = {
      phone: cart.delivery_phone,
      address: cart.address,
      street_name: cart.street_name,
      delivery_notes: cart.delivery_notes,
      lat: cart.lat,
      lng: cart.lng,
      delivery_fee: pending.delivery_fee || 0,
      distance_km: pending.distance_km || 0
    }

    const order = await createOrderAndRelated(trx, cart, items, deliveryData, amount)

    await trx('payments').insert({
      order_id: order.id,
      amount,
      payment_method: 'USSD',
      status: 'Completed',
      transaction_id,
      created_at: trx.fn.now()
    })

    await trx('orders').where({ id: order.id }).update({
      payment_status: 'paid',
      updated_at: trx.fn.now()
    })

    await trx('pending_payments').where({ id: pending.id }).del()

    await trx.commit()

    return res.status(200).json({ status: 'order created' })
  } catch (err) {
    await trx.rollback()
    console.error('Webhook error:', err)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}

module.exports = { clickPesaWebhookHandler }
