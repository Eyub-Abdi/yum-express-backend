const express = require('express')
const router = express.Router()
const { registerVendor } = require('../controllers/vendorController') // Import the vendor controller
const { verifyVendorEmail } = require('../controllers/vendorController')

// Vendor registration route
router.post('/register', registerVendor)
router.get('/verify-email', verifyVendorEmail)

module.exports = router
