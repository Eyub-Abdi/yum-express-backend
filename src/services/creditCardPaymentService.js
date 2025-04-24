module.exports = function processCreditCardPayment(totalPrice, card_number, card_expiry, card_cvc, order_id) {
  return Promise.resolve('Processing..', { totalPrice, card_number, card_cvc, card_expiry, order_id })
}
