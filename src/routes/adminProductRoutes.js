const express = require('express')
const router = express.Router()
const { getAllProducts } = require('../controllers/adminProductController')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')

router.get('/', authenticateUser, requireAdminRole('admin'), getAllProducts)

module.exports = router
