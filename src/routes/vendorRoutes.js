const express = require('express')
const router = express.Router()
const { registerVendor, getVendors, getVendorById, updateVendor, updateVendorEmail, deleteVendor, updateVendorPassword, deactivateOwnVendorAccount } = require('../controllers/vendorController') // Import the vendor controller
const { verifyVendorEmail } = require('../controllers/vendorController')

// Vendor routes
router.post('/register', registerVendor)
router.get('/verify-email', verifyVendorEmail)
router.get('/', getVendors)
router.get('/:id', getVendorById)
router.put('/:id', updateVendor)
router.put('/update-email/:id', updateVendorEmail)
router.put('/update-password', updateVendorPassword)
router.put('/deactivate-account', deactivateOwnVendorAccount)
router.delete('/:id', deleteVendor)

module.exports = router
