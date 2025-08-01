// src/routes/customerRoutes.js
const express = require('express')
const { registerCustomer, getCustomerById, getCustomers, getCustomerProfile, updateCustomer, updatePassword, deleteCustomer, verifyCustomerEmail } = require('../controllers/customerController')
const authenticatUser = require('../middleware/authenticateUser')

const router = express.Router()

// Customer routes
router.post('/register', registerCustomer)
router.get('/verify-email', verifyCustomerEmail)
router.get('/', getCustomers)
router.get('/me', authenticatUser, getCustomerProfile) // Get the authenticated customer's profile
router.get('/:id', getCustomerById)
router.put('/:id', authenticatUser, updateCustomer)
router.put('/update-password/:id', authenticatUser, updatePassword)
router.delete('/', authenticatUser, deleteCustomer)
router.delete('/:id', authenticatUser, deleteCustomer) // Admins delete any customer
module.exports = router
