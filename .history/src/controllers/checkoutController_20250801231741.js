const knex = require('../db/knex')
const { checkoutSchema } = require('../schemas/checkoutSchema')
const { calculateDeliveryFee } = require('../utils/distance')
const { handleCashPayment, handleMobilePayment, handleCreditCardPayment } = require('../services/checkoutService')

const checkoutCart = async (req, res) => {
  const { error } = checkoutSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const { cart_id, payment_method, phone_number: phoneNumber, card_number, card_expiry, card_cvc, delivery_phone: phone, address, street_name, delivery_notes, lat, lng } = req.body

  const cart = await knex('carts').where({ id: cart_id }).first()
  if (!cart) return res.status(404).json({ error: 'Cart not found' })
  if (cart.customer_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized access to this cart' })

  const items = await knex('cart_items').where({ cart_id }).join('products', 'cart_items.product_id', 'products.id').select('cart_items.product_id', 'cart_items.quantity', 'products.price', 'products.name', 'products.vendor_id', 'products.stock')

  if (!items.length) return res.status(400).json({ error: 'Cart is empty' })

  for (const item of items) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Not enough stock for ${item.name}. Available: ${item.stock}` })
    }
  }

  const vendorId = items[0].vendor_id
  const vendor = await knex('vendors').where({ id: vendorId }).first()
  if (!vendor || !vendor.lat || !vendor.lng) return res.status(400).json({ error: 'Invalid vendor location' })

  const { fee: deliveryFee, distanceInKm } = calculateDeliveryFee(lat, lng, vendor.lat, vendor.lng)

  const itemsTotal = items.reduce((sum, i) => sum + i.quantity * parseFloat(i.price), 0)
  const totalPrice = itemsTotal // + deliveryFee (add back later if needed)

  const trx = await knex.transaction()

  try {
    let result
    const deliveryData = {
      phone,
      address,
      street_name,
      delivery_notes,
      lat,
      lng,
      delivery_fee: deliveryFee,
      distance_km: distanceInKm
    }

    if (payment_method === 'cash') {
      result = await handleCashPayment(trx, cart, items, deliveryData, totalPrice)
    } else if (payment_method === 'mobile') {
      result = await handleMobilePayment(trx, cart, items, deliveryData, totalPrice, phoneNumber)
    } else if (payment_method === 'creditcard') {
      const cardDetails = { card_number, card_expiry, card_cvc }
      result = await handleCreditCardPayment(trx, cart, items, deliveryData, totalPrice, cardDetails)
    } else {
      await trx.rollback()
      return res.status(400).json({ error: 'Invalid payment method' })
    }

    // If the payment initiation failed (not 202), rollback and end the request
    if (result.status !== '202' && payment_method !== 'cash') {
      await trx.rollback()
      return res.status(result.status).json({ error: 'Payment initiation failed', ...result.response })
    }

    // If successful, commit transaction
    await trx.commit()
    return res.status(result.status).json(result.response)
  } catch (err) {
    await trx.rollback()
    console.error('Checkout error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again later' })
  }
}

module.exports = { checkoutCart }
