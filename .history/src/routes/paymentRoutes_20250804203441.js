const express = require('express')
const router = express.Router()
const { getPaymentStatus } = require('../controllers/getPaymentStatus')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')
const { getAllPayments } = require('../controllers/paymentController')

// GET /api/payment-status?orderReference=xxx or ?transaction_id=yyy
router.get('/payment-status', authenticateUser, getPaymentStatus)
router.get('/all', getAllPayments)
module.exports = router
