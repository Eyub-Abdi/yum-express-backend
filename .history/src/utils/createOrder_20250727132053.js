async function createOrderAndRelated(trx, cart, items, deliveryData, totalPrice) {
  const vendorId = items[0].vendor_id

  const [order] = await trx('orders')
    .insert({
      customer_id: cart.customer_id,
      vendor_id: vendorId,
      total_price: totalPrice,
      payment_status: 'pending',
      order_status: 'processing',
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
