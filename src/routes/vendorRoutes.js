const express = require('express')
const router = express.Router()
const { registerVendor, getVendorById, updateVendor, updateVendorEmail, deleteVendor, updateVendorPassword, deactivateOwnVendorAccount, getVendorsWithFilter, getNearbyVendors, getVendorProfile } = require('../controllers/vendorController') // Import the vendor controller
const { verifyVendorEmail } = require('../controllers/vendorController')
const authenticateUser = require('../middleware/authenticateUser')
const getUploadMiddleware = require('../middleware/upload')
const preUploadValidation = require('../middleware/preUploadValidation')
const { vendorRegistrationSchema } = require('../schemas/vendorSchema')

const uploadBanner = getUploadMiddleware('banners')
// Vendor routes
router.post('/register', uploadBanner.single('banner'), preUploadValidation(vendorRegistrationSchema), registerVendor)
router.get('/verify-email', verifyVendorEmail)
router.get('/', getVendorsWithFilter)
router.get('/near-by', getNearbyVendors)
router.get('/me', authenticateUser, getVendorProfile)
router.get('/:id', getVendorById)
router.put('/update-password', authenticateUser, updateVendorPassword)
router.put('/deactivate-account', authenticateUser, deactivateOwnVendorAccount)
router.put('/:id', uploadBanner.single('banner'), updateVendor) // AUTHENTICATE USER HERE THIS IS TESTING WITOUT AUTH
router.put('/update-email/:id', authenticateUser, updateVendorEmail)
router.delete('/:id', authenticateUser, deleteVendor)

module.exports = router
