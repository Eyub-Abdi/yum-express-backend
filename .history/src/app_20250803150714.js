require('express-async-errors')
const logger = require('./utils/logger')
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
  // const response = await sendEmail({
  //   recipientEmail: ['ayubabdiy@gmail.com'],
  //   firstName: 'Ayub',
  //   type: 'info',
  //   payload: {
  //     subject: 'Your Order is Canceld',
  //     title: 'Order Canceld',
  //     message: 'Your order has been picked up by the rider and is on its way. You can expect it soon! Thank you for trusting us',
  //     actionLink: 'https://yum-express.tz/track-order/123',
  //     buttonText: 'Thanks for trusting us'
  //   }
  // })

  // const response = await sendEmail({
  //   recipientEmail: 'ayubabdiy@gmail.com',
  //   firstName: 'John',
  //   type: 'support',
  //   payload: {
  //     entityType: 'customer', // or 'vendor' or any entity you're verifying
  //     token: 'verification-token-generated'
  //   }
  // })
  // const password = generateDefaultPassword()
  // const response = await sendSMS('255657777687', orderConfirmationMsg)
  await sendEmail({
    recipientEmail: ['ayubabdiy@gmail.com'], // multiple admins
    firstName: 'Admin',
    type: 'rejectOrder',
    payload: {
      orderId: 1234,
      vendorName: 'Elegant Wears',
      reason: 'Product out of stock',
      vendorPhone: '+255657777687',
      customerPhone: '+255754321098',
      subject: 'Order #1234 Rejected by Vendor',
      title: 'Order Rejected Notification'
    }
  })

  res.status(200).json('Done')
})
// const p = Promise.reject(new Error('Utumbo wa kima'))
// p.then(() => console.log('Done'))

app.use(error)
const port = process.env.PORT || 5000
app.listen(port, () => logger.info(`Listening on port ${port}...`))
