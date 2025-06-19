const express = require('express')
const router = express.Router()
const { getAllVendorsForAdmin, getVendorByIdForAdmin, banVendor, activateDeactivateVendor } = require('../controllers/adminVendorController')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')

router.get('/', authenticateUser, requireAdminRole('admin'), getAllVendorsForAdmin)
router.get('/:id', authenticateUser, requireAdminRole('admin'), getVendorByIdForAdmin)
router.put('/:id/ban', authenticateUser, requireAdminRole('superadmin'), banVendor)
router.put('/:id/activate', authenticateUser, requireAdminRole('superadmin'), activateDeactivateVendor)
module.exports = router
