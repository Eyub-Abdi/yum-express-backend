const express = require('express')
const router = express.Router()
const { getVendorOrders, updateVendorOrderStatus, assignDriverToDelivery } = require('../controllers/orderController')
const authenticateUser = require('../middleware/authenticateUser')

router.get('/vendor-orders', authenticateUser, getVendorOrders)
router.put('/vendor-orders/:id', authenticateUser, updateVendorOrderStatus)
router.patch('/assign-driver', authenticateUser, assignDriverToDelivery)

module.exports = router
