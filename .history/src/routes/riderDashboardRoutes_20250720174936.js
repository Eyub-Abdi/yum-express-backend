const express = require('express')
const router = express.Router()
const { registerDriver, verifyDriverEmail, getDriverProfile, getDriverById, deleteDriver, recoverDriver, getAllDrivers } = require('../controllers/driverController')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')

// Route to register a driver
router.post('/register', authenticateUser, requireAdminRole('superadmin'), registerDriver)
router.get('/verify-email', verifyDriverEmail)
router.get('/', getAllDrivers)
router.get('/me', authenticateUser, getDriverProfile)
router.get('/:id', authenticateUser, requireAdminRole('admin'), getDriverById)
router.put('/delete/:id', authenticateUser, requireAdminRole('superadmin'), deleteDriver)
router.put('/recover/:id', authenticateUser, requireAdminRole('superadmin'), recoverDriver)
module.exports = router
