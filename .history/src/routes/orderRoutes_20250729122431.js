const express = require('express')
const router = express.Router()
const { getVendorOrders, updateVendorOrderStatus, assignDriverToDelivery, acceptVendorOrder, getCustomerOrderHistory, confirmDelivery, rejectVendorOrder } = require('../controllers/orderController')
const authenticateUser = require('../middleware/authenticateUser')

router.get('/vendor-orders', authenticateUser, getVendorOrders)
router.get('/me', authenticateUser, getCustomerOrderHistory)
router.put('/vendor-orders/:id/accept', authenticateUser, acceptVendorOrder)
router.put('/vendor-orders/:id/reject', authenticateUser, rejectVendorOrder)
router.put('/vendor-orders/:id', authenticateUser, updateVendorOrderStatus)
router.patch('/delivery/:id/confirm-delivered', authenticateUser, confirmDelivery)
router.patch('/assign-driver', authenticateUser, assignDriverToDelivery)

module.exports = router
