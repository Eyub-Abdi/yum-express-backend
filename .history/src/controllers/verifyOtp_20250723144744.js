const verifyCustomerEmail = async (req, res) => {
  await verifyEmail('customers', req, res)
}
