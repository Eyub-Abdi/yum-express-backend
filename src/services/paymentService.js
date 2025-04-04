// Simulate a payment process
const processPayment = async (totalPrice, customerId) => {
  // Simulate a delay for payment processing (e.g., network request to payment gateway)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Simulate random success or failure
  const isSuccess = Math.random() > 0.2 // 80% chance of success

  if (isSuccess) {
    // Simulate successful payment details
    const transactionId = `txn_${Math.floor(Math.random() * 1000000000)}` // Example transaction ID
    const paymentMethod = 'Credit Card' // Example payment method (this would be dynamic based on the payment method chosen)

    return {
      success: true,
      message: 'Payment successful',
      transaction_id: transactionId,
      payment_method: paymentMethod,
      amount: totalPrice
    }
  } else {
    return {
      success: false,
      message: 'Payment failed. Try again later.',
      transaction_id: null,
      payment_method: null,
      amount: 0
    }
  }
}

module.exports = { processPayment }
