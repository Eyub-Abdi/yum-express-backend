// routes/adminRoutes.js
const express = require('express')
const router = express.Router()
const { registerAdmin, verifyAdminEmail, getAllAdmins, getAdminById, getAdminProfile, updateAdmin, deleteAdmin, updateAdminPassword, updateAdminName } = require('../controllers/adminController')
const authenticateUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')
const { updateAdminEmailSchema } = require('../schemas/adminSchema')

// POST /admins/register
router.post('/register', authenticateUser, requireAdminRole('superadmin'), registerAdmin)
router.get('/verify-email', verifyAdminEmail)
router.get('/', authenticateUser, requireAdminRole('superadmin'), getAllAdmins)
router.get('/me', authenticateUser, requireAdminRole('admin'), getAdminProfile)
router.get('/:id', authenticateUser, requireAdminRole('superadmin'), getAdminById)
router.put('/change-password', authenticateUser, requireAdminRole('admin'), updateAdminPassword)
router.put('/update-name', authenticateUser, requireAdminRole('admin'), updateAdminName)

router.put('/:id', authenticateUser, requireAdminRole('superadmin'), updateAdmin)
router.delete('/:id', authenticateUser, requireAdminRole('superadmin'), deleteAdmin)
module.exports = router
