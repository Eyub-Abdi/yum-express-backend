// routes/deliveryRoutes.js
const express = require('express')
const router = express.Router()
const { estimateDeliveryFee } = require('../controllers/deliveryController')

router.post('/estimate-fee', estimateDeliveryFee)

module.exports = router
