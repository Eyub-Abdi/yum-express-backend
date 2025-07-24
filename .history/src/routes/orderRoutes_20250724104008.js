const express = require('express')
const router = express.Router()
const { getVendorOrders, updateVendorOrderStatus, assignDriverToDelivery, acceptVendorOrder, getCustomerOrderHistory } = require('../controllers/orderController')
const authenticateUser = require('../middleware/authenticateUser')

router.get('/vendor-orders', authenticateUser, getVendorOrders)
router.get('/me', authenticateUser, getCustomerOrderHistory)
router.put('/vendor-orders/:id/accept', authenticateUser, acceptVendorOrder)
router.put('/vendor-orders/:id', authenticateUser, updateVendorOrderStatus)
router.patch('/deliveries/:id/confirm', authenticate, confirmDelivery)
router.patch('/assign-driver', authenticateUser, assignDriverToDelivery)

module.exports = router
