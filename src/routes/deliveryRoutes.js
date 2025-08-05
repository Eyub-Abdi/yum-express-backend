// routes/deliveryRoutes.js
const express = require('express')
const router = express.Router()
const { getAllDeliveries,estimateDeliveryFee, getAvailableDeliveries, pickDelivery } = require('../controllers/deliveryController')
const authenticateUser = require('../middleware/authenticateUser')

router.get('/', getAllDeliveries)
router.get('/availabe-deliveries', getAvailableDeliveries)
router.post('/estimate-fee', estimateDeliveryFee)
router.put('/pick', authenticateUser, pickDelivery)

module.exports = router
