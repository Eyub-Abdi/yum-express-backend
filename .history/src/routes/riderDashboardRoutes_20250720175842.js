const express = require('express')
const router = express.Router()
const { registerDriver, verifyDriverEmail, getDriverProfile, getDriverById, deleteDriver, recoverDriver, getAllDrivers } = require('../controllers/driverController')
const authenticateUser = require('../middleware/authenticateUser')
const { getAllRidersDashboard } = require('../controllers/riderDashboardController')
// Route to register a driver
router.post('/dashboard', authenticateUser, getAllRidersDashboard)
router.get('/verify-email', verifyDriverEmail)

module.exports = router
