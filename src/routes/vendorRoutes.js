const express = require('express')
const router = express.Router()
const { registerVendor, getVendorById, updateVendor, updateVendorEmail, deleteVendor, updateVendorPassword, deactivateOwnVendorAccount, getVendorsWithFilter } = require('../controllers/vendorController') // Import the vendor controller
const { verifyVendorEmail } = require('../controllers/vendorController')
const authenticateUser = require('../middleware/authenticateUser')

// Vendor routes
router.post('/register', registerVendor)
router.get('/verify-email', verifyVendorEmail)
router.get('/', getVendorsWithFilter)
router.get('/:id', getVendorById)
router.put('/update-password', authenticateUser, updateVendorPassword)
router.put('/deactivate-account', authenticateUser, deactivateOwnVendorAccount)
router.put('/:id', authenticateUser, updateVendor)
router.put('/update-email/:id', authenticateUser, updateVendorEmail)
router.delete('/:id', authenticateUser, deleteVendor)

module.exports = router
