const express = require('express')
const router = express.Router()
const { getAllOrders } = require('../controllers/adminOrderController')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')

router.get('/', authenticateUser, requireAdminRole('admin'), getAllOrders)

module.exports = router
