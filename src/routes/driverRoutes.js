const express = require('express')
const router = express.Router()
const { registerDriver, verifyDriverEmail } = require('../controllers/driverController')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')

// Route to register a driver
router.post('/register', authenticateUser, requireAdminRole('superadmin'), registerDriver)
router.get('/verify-email', verifyDriverEmail)
module.exports = router
