const express = require('express')
const router = express.Router()
const { getPaymentStatus } = require('../controllers/getPaymentStatus')
const authenticateUser = require('../middleware/authenticateUser')

// GET /api/payment-status?orderReference=xxx or ?transaction_id=yyy
router.get('/payment-status', authenticateUser, getPaymentStatus)

module.exports = router
