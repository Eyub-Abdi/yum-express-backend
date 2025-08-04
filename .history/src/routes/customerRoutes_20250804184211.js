// src/routes/customerRoutes.js
const express = require('express')
const { registerCustomer, getCustomerById, getCustomers, getCustomerProfile, updateCustomer, updatePassword, deleteCustomer, verifyCustomerEmail, updateCustomerName, updateCustomerPhone, updateCustomerEmail, verifyCustomerOtp } = require('../controllers/customerController')
const authenticatUser = require('../middleware/authenticateUser')
const { requireAdminRole } = require('../middleware/requireAdminRole')

const router = express.Router()

// Customer routes
router.post('/register', registerCustomer)
router.get('/verify-email', verifyCustomerEmail)
router.post('/verify/otp', authenticatUser, verifyCustomerOtp)
router.get('/', authenticatUser, requireAdminRole('admin'), getCustomers)
router.get('/me', authenticatUser, getCustomerProfile) // Get the authenticated customer's profile
router.get('/:id', getCustomerById)
router.put('/change/name', authenticatUser, updateCustomerName)
router.put('/change/password', authenticatUser, updatePassword)
router.put('/change/phone', authenticatUser, updateCustomerPhone)
router.put('/change/email', authenticatUser, updateCustomerEmail)

router.put('/:id', authenticatUser, updateCustomer)

router.delete('/', authenticatUser, deleteCustomer)
router.delete('/:id', authenticatUser, requireAdminRole('superadmin'), deleteCustomer) // Admins delete any customer
module.exports = router
