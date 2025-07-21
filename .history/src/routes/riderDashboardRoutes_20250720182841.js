const express = require('express')
const router = express.Router()
const { registerDriver, verifyDriverEmail, getDriverProfile, getDriverById, deleteDriver, recoverDriver, getAllDrivers } = require('../controllers/driverController')
const authenticateUser = require('../middleware/authenticateUser')
const { getAllRiderOrders } = require('../controllers/riderDashboardController')
// Route to register a driver
router.get('/dashboard', getAllRiderOrders)
router.get('/verify-email', verifyDriverEmail)

module.exports = router
