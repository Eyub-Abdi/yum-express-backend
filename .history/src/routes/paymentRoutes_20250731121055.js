const express = require('express')
const router = express.Router()
const { getPaymentStatus } = require('../controllers/getPaymentStatus')

// GET /api/payment-status?orderReference=xxx or ?transaction_id=yyy
router.get('/payment-status', getPaymentStatus)

module.exports = router
