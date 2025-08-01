const knex = require('../db/knex')
const { createOrderAndRelated } = require('../services/checkoutService')

const clickPesaWebhookHandler = async (req, res) => {
  const payload = req.body

  console.log('Received ClickPesa webhook:', payload)

  const { event, data } = payload || {}

  if (!data) {
    return res.status(400).json({ message: 'Missing data in webhook payload' })
  }

  const { status, id: transaction_id, orderReference, collectedAmount, message, channel } = data
  const amount = parseFloat(collectedAmount)

  // Validate essential values
  if (!event || !transaction_id || !orderReference) {
    console.warn('Missing essential fields')
    return res.status(400).json({
      message: 'Missing event, transaction_id, or orderReference in payload'
    })
  }

  const normalizedStatus = status?.toLowerCase()
  const normalizedEvent = event?.toLowerCase()

  if (!normalizedEvent.includes('payment')) {
    return res.status(400).json({ message: 'Ignored non-payment event' })
  }

  const trx = await knex.transaction()

  try {
    const pending = await trx('pending_payments').where({ order_reference: orderReference }).first()

    if (!pending) {
      await trx.rollback()
      console.warn('Pending payment not found for:', orderReference)
      return res.status(404).json({ message: 'Pending payment not found' })
    }

    if (normalizedStatus === 'failed' || normalizedEvent === 'payment failed') {
      // Success flow
      const cart = await trx('carts').where({ id: pending.cart_id }).first()
      const items = await trx('cart_items').where({ cart_id: cart.id }).join('products', 'cart_items.product_id', 'products.id')

      const deliveryData = {
        phone: pending.phone,
        address: pending.address,
        street_name: pending.street_name,
        delivery_notes: pending.delivery_notes || '',
        lat: pending.lat,
        lng: pending.lng,
        delivery_fee: pending.delivery_fee,
        distance_km: pending.distance_km
      }

      const order = await createOrderAndRelated(trx, cart, items, deliveryData, amount)

      await trx('payments').insert({
        order_id: order.id,
        amount,
        payment_method: channel,
        status: 'Completed',
        order_reference: orderReference,
        transaction_id,
        message: message,
        created_at: trx.fn.now()
      })

      await trx('orders').where({ id: order.id }).update({
        payment_status: 'Paid',
        updated_at: trx.fn.now()
      })

      await trx('pending_payments').where({ id: pending.id }).del()
      await trx.commit()

      console.log(`Payment successful and order ${order.id} created.`)
      return res.status(200).json({ status: 'Payment successful' })
    }

    // if (normalizedStatus === 'failed' || normalizedEvent === 'payment failed') {
    //   // Failure flow
    //   await trx('pending_payments').where({ id: pending.id }).del()

    //   await trx('payments').insert({
    //     order_id: null,
    //     amount: amount || 0,
    //     payment_method: channel,
    //     status: 'Failed',
    //     message: message,
    //     order_reference: orderReference,
    //     transaction_id,
    //     created_at: trx.fn.now()
    //   })

    //   await trx.commit()
    //   console.warn(`Payment failed for orderRef: ${orderReference}`)
    //   return res.status(200).json({ status: 'payment failed handled' })
    // }

    await trx.rollback()
    return res.status(400).json({ message: 'Unsupported status or event' })
  } catch (err) {
    await trx.rollback()
    console.error('Webhook error:', err)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}

module.exports = { clickPesaWebhookHandler }
