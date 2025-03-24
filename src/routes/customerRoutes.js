// src/routes/customerRoutes.js
const express = require('express')
const { registerCustomer, getCustomerById, getCustomers, updateCustomer, updatePassword, deleteCustomer } = require('../controllers/customerController')
const authorizeUser = require('../middleware/authorizeUser')

const router = express.Router()

// Register a customer
router.post('/register', registerCustomer)
router.get('/', getCustomers)
router.get('/:id', getCustomerById)
router.put('/:id', authorizeUser, updateCustomer)
router.put('/update-password/:id', authorizeUser, updatePassword)
router.delete('/', authorizeUser, deleteCustomer)
router.delete('/:id', authorizeUser, deleteCustomer) // Admins delete any customer

module.exports = router
