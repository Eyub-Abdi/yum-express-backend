const express = require('express')
const router = express.Router()
const { getAllProductsForAdmin } = require('../controllers/adminProductController')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')

router.get('/', authenticateUser, requireAdminRole('admin'), getAllProductsForAdmin)

module.exports = router
