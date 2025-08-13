const { processPayment } = require('../services/paymentService')
const { sendEmail } = require('./emailService')

// const { processCreditCardPayment } = require('../services/creditCardPaymentService') // We'll create this

async function createOrderAndRelated(trx, cart, items, deliveryData, totalPrice) {
  const vendorId = items[0].vendor_id

  const [order] = await trx('orders')
    .insert({
      customer_id: cart.customer_id,
      vendor_id: vendorId,
      total_price: totalPrice,
      payment_status: 'pending',
      order_status: 'pending',
      created_at: trx.fn.now()
    })
    .returning('*')

  await trx('deliveries').insert({
    order_id: order.id,
    customer_id: cart.customer_id,
    vendor_id: vendorId,
    phone: deliveryData.phone,
    address: deliveryData.address,
    street_name: deliveryData.street_name,
    delivery_notes: deliveryData.delivery_notes,
    lat: deliveryData.lat,
    lng: deliveryData.lng,
    delivery_fee: deliveryData.delivery_fee,
    distance_km: deliveryData.distance_km,
    created_at: trx.fn.now()
  })

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    created_at: trx.fn.now()
  }))
  await trx('order_items').insert(orderItems)

  return order
}

async function handleMobilePayment(trx, cart, items, deliveryData, totalPrice, phoneNumber) {
  const orderReference = `ORD${Date.now()}${cart.customer_id}`

  const paymentResult = await processPayment(totalPrice, phoneNumber, orderReference)

  console.log('Inserting pending_payments with order ref', orderReference)
  if (paymentResult.success) {
    await trx('pending_payments').insert({
      cart_id: cart.id,
      order_reference: orderReference,
      transaction_id: paymentResult.transaction_id,
      amount: totalPrice,
      delivery_fee: deliveryData.delivery_fee,
      distance_km: deliveryData.distance_km,
      phone: deliveryData.phone,
      address: deliveryData.address,
      street_name: deliveryData.street_name,
      delivery_notes: deliveryData.delivery_notes || '',
      lat: deliveryData.lat,
      lng: deliveryData.lng,
      created_at: trx.fn.now()
    })
    await trx.commit()
    return {
      status: 202,
      response: {
        message: 'Payment initiated. Waiting for confirmation...',
        status: 'pending',
        transaction_id: paymentResult.transaction_id,
        order_reference: orderReference
      }
    }
  }
  await trx.rollback()
  return {
    status: 400,
    response: {
      error: paymentResult.message || 'Failed to initiate payment'
    }
  }
}

// async function handleCashPayment(trx, cart, items, deliveryData, totalPrice) {
//   const orderReference = `ORD${Date.now()}${cart.customer_id}`

//   const order = await createOrderAndRelated(trx, cart, items, deliveryData, totalPrice)

//   await trx('payments').insert({
//     order_id: order.id,
//     amount: totalPrice,
//     payment_method: 'CASH',
//     status: 'Pending',
//     transaction_id: null,
//     order_reference: orderReference,
//     message: 'Cash on delivery'
//   })

//   for (const item of items) {
//     await trx('products').where({ id: item.product_id }).decrement('stock', item.quantity)
//   }

//   await trx('cart_items').where({ cart_id: cart.id }).del()
//   await trx('carts').where({ id: cart.id }).del()

//   await trx.commit()

//   return {
//     status: 201,
//     response: {
//       message: 'Order placed successfully, pay cash on delivery',
//       order_id: order.id,
//       total: totalPrice
//     }
//   }
// }

async function handleCashPayment(trx, cart, items, deliveryData, totalPrice) {
  const orderReference = `ORD${Date.now()}${cart.customer_id}`

  const order = await createOrderAndRelated(trx, cart, items, deliveryData, totalPrice)

  await trx('payments').insert({
    order_id: order.id,
    amount: totalPrice,
    payment_method: 'CASH',
    status: 'Pending',
    transaction_id: null,
    order_reference: orderReference,
    message: 'Cash on delivery'
  })

  for (const item of items) {
    // Reduce stock
    await trx('products').where({ id: item.product_id }).decrement('stock', item.quantity)

    // Check updated stock
    const updatedProduct = await trx('products').select('stock', 'vendor_id', 'name').where({ id: item.product_id }).first()

    if (updatedProduct.stock <= 5) {
      // Fetch vendor email & first name
      const vendor = await trx('vendors').select('email', 'first_name').where({ id: updatedProduct.vendor_id }).first()

      if (vendor && vendor.email) {
        await sendEmail({
          recipientEmail: vendor.email,
          firstName: vendor.first_name || 'Vendor',
          type: 'info',
          payload: {
            subject: 'Low Stock Alert',
            title: 'Stock Running Low',
            message: `Your product <b>${updatedProduct.name}</b> now has only <b>${updatedProduct.stock}</b> items left in stock.`
          }
        })
      }
    }
  }

  await trx('cart_items').where({ cart_id: cart.id }).del()
  await trx('carts').where({ id: cart.id }).del()

  await trx.commit()

  return {
    status: 201,
    response: {
      message: 'Order placed successfully, pay cash on delivery',
      order_id: order.id,
      total: totalPrice
    }
  }
}

async function handleCreditCardPayment(trx, cart, items, deliveryData, totalPrice, cardDetails) {
  const order = await createOrderAndRelated(trx, cart, items, deliveryData, totalPrice)

  const paymentResult = await processCreditCardPayment(totalPrice, cardDetails.card_number, cardDetails.card_expiry, cardDetails.card_cvc, order.id)

  if (paymentResult.success === true) {
    await trx('payments').insert({
      order_id: order.id,
      amount: totalPrice,
      payment_method: paymentResult.payment_method,
      status: 'Completed',
      transaction_id: paymentResult.transaction_id,
      created_at: trx.fn.now()
    })

    await trx('orders').where({ id: order.id }).update({
      payment_status: 'paid',
      updated_at: trx.fn.now()
    })

    for (const item of items) {
      await trx('products').where({ id: item.product_id }).decrement('stock', item.quantity)
    }

    // Clear cart
    await trx('cart_items').where({ cart_id: cart.id }).del()
    await trx('carts').where({ id: cart.id }).del()

    await trx.commit()

    return {
      status: 200,
      response: {
        message: 'Checkout successful and payment processed',
        order_id: order.id,
        total: totalPrice
      }
    }
  }

  if (paymentResult.success === null) {
    await trx.commit()
    return {
      status: 202,
      response: {
        message: paymentResult.message,
        order_id: order.id,
        payment_status: 'pending',
        transaction_id: paymentResult.transaction_id
      }
    }
  }

  // Payment failed
  await trx.rollback()
  return { status: 402, response: { error: paymentResult.message || 'Payment failed' } }
}
module.exports = {
  createOrderAndRelated,
  handleCashPayment,
  handleMobilePayment,
  handleCreditCardPayment
}
