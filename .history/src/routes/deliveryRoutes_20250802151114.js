// routes/deliveryRoutes.js
const express = require('express')
const router = express.Router()
const { estimateDeliveryFee, getAvailableDeliveries } = require('../controllers/deliveryController')

router.get('/availabe-deliveries', getAvailableDeliveries)
router.post('/estimate-fee', estimateDeliveryFee)

module.exports = router
