const express = require('express')
const router = express.Router()
const { registerVendor, getVendorById, updateVendor, updateVendorEmail, deleteVendor, updateVendorPassword, deactivateOwnVendorAccount, getVendorsWithFilter, getNearbyVendors, getVendorProfile, updateVendorName, updateBusinessName, updateVendorPhone, updateVendorAddress, updateVendorHours, updateVendorLocation } = require('../controllers/vendorController') // Import the vendor controller

const { verifyVendorEmail } = require('../controllers/vendorController')
const authenticateUser = require('../middleware/authenticateUser')
const getUploadMiddleware = require('../middleware/upload')
const preUploadValidation = require('../middleware/preUploadValidation')
const { vendorRegistrationSchema } = require('../schemas/vendorSchema')
const vendorOnly = require('../middleware/vendorOnly')

const uploadBanner = getUploadMiddleware('banners')
// Vendor routes
router.post('/register', uploadBanner.single('banner'), preUploadValidation(vendorRegistrationSchema), registerVendor)
router.get('/verify-email', verifyVendorEmail)
router.get('/', getVendorsWithFilter)
router.get('/near-by', getNearbyVendors)
router.get('/me', authenticateUser, getVendorProfile)
router.get('/:id', getVendorById)

// ====VENDOR PROFILE UPDATION====
router.put('/change-password', authenticateUser, updateVendorPassword)
router.put('/change-email', authenticateUser, updateVendorEmail)
router.put('/deactivate-account', authenticateUser, deactivateOwnVendorAccount)
router.put('/update-name', authenticateUser, updateVendorName)
router.put('/update-address', authenticateUser, updateVendorAddress)
router.put('/update-business-name', authenticateUser, updateBusinessName)
router.put('/change-phone', authenticateUser, updateVendorPhone)
router.put('/update-business-hours', authenticateUser, updateVendorHours)
router.put('/location', authenticateUser, vendorOnly, updateVendorLocation)

router.delete('/:id', authenticateUser, deleteVendor)
// ====VENDOR PROFILE UPDATION====
router.put('/:id', uploadBanner.single('banner'), authenticateUser, updateVendor) // AUTHENTICATE USER HERE THIS IS TESTING WITOUT AUTH

module.exports = router
