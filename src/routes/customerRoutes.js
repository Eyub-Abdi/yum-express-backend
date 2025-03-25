// src/routes/customerRoutes.js
const express = require('express')
const { registerCustomer, getCustomerById, getCustomers, updateCustomer, updatePassword, deleteCustomer } = require('../controllers/customerController')
const authenticatUser = require('../middleware/authenticateUser')

const router = express.Router()

// Register a customer
router.post('/register', registerCustomer)
router.get('/', getCustomers)
router.get('/:id', getCustomerById)
router.put('/:id', authenticatUser, updateCustomer)
router.put('/update-password/:id', authenticatUser, updatePassword)
router.delete('/', authenticatUser, deleteCustomer)
router.delete('/:id', authenticatUser, deleteCustomer) // Admins delete any customer

module.exports = router
