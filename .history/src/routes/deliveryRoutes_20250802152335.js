// routes/deliveryRoutes.js
const express = require('express')
const router = express.Router()
const { estimateDeliveryFee, getAvailableDeliveries, pickDelivery } = require('../controllers/deliveryController')
const authenticateUser = require('../middleware/authenticateUser')

router.get('/availabe-deliveries', getAvailableDeliveries)
router.post('/estimate-fee', estimateDeliveryFee)
router.put('/pick', pickDelivery)
module.exports = router
