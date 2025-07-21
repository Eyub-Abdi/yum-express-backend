const express = require('express')
const router = express.Router()
const { registerDriver, verifyDriverEmail, getDriverProfile, getDriverById, deleteDriver, recoverDriver, getAllDrivers } = require('../controllers/driverController')
const authenticateUser = require('../middleware/authenticateUser')
const { riderDashboardController } = require('../controllers/riderDashboardController')
// Route to register a driver
router.post('/rider/dashboard', authenticateUser, riderDashboardController)
router.get('/verify-email', verifyDriverEmail)

module.exports = router
