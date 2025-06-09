const express = require('express')
const router = express.Router()
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')
const { getAdminDashboard } = require('../controllers/adminDashboard')

router.get('/', authenticateUser, requireAdminRole('admin'), getAdminDashboard)
module.exports = router
