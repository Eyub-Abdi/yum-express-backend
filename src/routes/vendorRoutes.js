const express = require('express')
const router = express.Router()
const { registerVendor } = require('../controllers/vendorController') // Import the vendor controller

// Vendor registration route
router.post('/register', registerVendor)

module.exports = router
