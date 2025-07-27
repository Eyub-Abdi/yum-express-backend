async function handleCashPayment(trx, cart, items, deliveryData, totalPrice) {
  const order = await createOrderAndRelated(trx, cart, items, deliveryData, totalPrice)

  // Decrement stock
  for (const item of items) {
    await trx('products').where({ id: item.product_id }).decrement('stock', item.quantity)
  }

  // Clear cart
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

async function handleMobilePayment(trx, cart, items, deliveryData, totalPrice, phoneNumber) {
  const order = await createOrderAndRelated(trx, cart, items, deliveryData, totalPrice)

  const paymentResult = await processPayment(totalPrice, phoneNumber, order.id)

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
