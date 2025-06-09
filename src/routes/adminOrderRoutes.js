const express = require('express')
const router = express.Router()
const { getAllOrders, updateStatus } = require('../controllers/adminOrderController')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')

router.get('/', authenticateUser, requireAdminRole('admin'), getAllOrders)
router.patch('/status', authenticateUser, requireAdminRole('admin'), updateStatus)
module.exports = router
