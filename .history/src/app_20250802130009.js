require('express-async-errors')
const winston = require('winston')
const express = require('express')
const app = express()
const path = require('path')
const debug = require('debug')('app')
const error = require('./middleware/error')
const cors = require('cors')
const config = require('../config/default')
const { sendSMS } = require('./services/smsService')

const cookiePerser = require('cookie-parser')
const customerRoutes = require('./routes/customerRoutes')
const vendoRoutes = require('./routes/vendorRoutes')
const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const cartRoutes = require('./routes/cartRoutes')
const checkoutRoutes = require('./routes/checkoutRoute')
const orderRoutes = require('./routes/orderRoutes')
const salesRoutes = require('./routes/salesRoutes')
const driverRoutes = require('./routes/driverRoutes')
const adminRoutes = require('./routes/adminRoutes')
const storeRoutes = require('./routes/storeRoutes')
const productRoutesForAdmin = require('./routes/productRoutesForAdmin')
const vendorRoutesForAdmin = require('./routes/vendorRoutesForAdmin')
const adminOrderRoutes = require('./routes/adminOrderRoutes')
const adminDashboardRoutes = require('./routes/adminDashboardRoutes')
const vendorDashboardRoutes = require('./routes/vendorDashboardRoutes')
const { orderConfirmationMsg } = require('./utils/textMessages')
const supportRoutes = require('./routes/supportRoutes')
const riderDashboardRoutes = require('./routes/riderDashboardRoutes')
const verificationRoutes = require('./routes/verificationRoutes')
const deliveryRoutes = require('./routes/deliveryRoutes')
const webhookRoutes = require('./routes/webhookRoutes')
const paymentRoutes = require('./routes/paymentRoutes')

const { sendEmail } = require('./services/emailService')
const generateDefaultPassword = require('./utils/passwordGenerator')
const { buildWelcomeMessage } = require('./utils/welcomeMessages')
const generateOtp = require('./utils/otpGenerator')

if (!config.jwt.secret) {
  debug('FATAL ERROR, JWT_SECRET IS NOT SET')
  process.exit(1)
} else debug('JWT_SECRET IS NOW SET')

debug(config.db.database)
debug(config.email.user)
debug(config.email.pass)
debug(config.email.host)
debug(config.email.port)
debug(config.email.secure)
debug(config.session.secret)
debug(config.payment.clientId)
debug(config.payment.apiKey)
debug(config.sms.username)
debug(config.sms.password)
debug(config.sms.isTestMode)
debug(config.sms.senderId)

app.use(express.json())
app.use(cookiePerser())
app.use(
  cors({
    origin: 'http://localhost:3000', // or your frontend URL
    credentials: true
  })
)
// SERVER STATIC FILES
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')))
app.use('/api/webhook', webhookRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/vendors', vendoRoutes)
app.use('/api/products', productRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/delivery', deliveryRoutes) // Delivery routes
app.use('/api/store', storeRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/riders', riderDashboardRoutes)
app.use('/api/admins', adminRoutes)
app.use('/api/admin/products', productRoutesForAdmin)
app.use('/api/admin/vendors', vendorRoutesForAdmin)
app.use('/api/admin-orders', adminOrderRoutes)
app.use('/api/admin-dashboard', adminDashboardRoutes)
app.use('/api/vendor/dashboard', vendorDashboardRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/verify', verificationRoutes)
app.use('/api/payment', paymentRoutes)

app.get('/', async (req, res) => {
  {
    message: 'Order confirmed and SMS sent.'
  }
  // const response = await sendEmail({
  //   recipientEmail: 'ayubabdiy@gmail.com',
  //   firstName: 'John',
  //   type: 'support',
  //   payload: {
  //     entityType: 'customer', // or 'vendor' or any entity you're verifying
  //     token: 'verification-token-generated'
  //   }
  // })
  // throw new Error('Utumbo wa kima')
  const password = generateDefaultPassword()
  const response = await sendSMS('255657777687', orderConfirmationMsg)
  res.status(200).json(response.data)
})

app.use(error)
const port = process.env.PORT || 5000
app.listen(port, () => winston.info(`Listening on port ${port}...`))
