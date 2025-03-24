// src/routes/customerRoutes.js
const express = require('express')
const { registerCustomer, getCustomerById, getCustomers, updateCustomer, updatePassword } = require('../controllers/customerController')

const router = express.Router()

// Register a customer
router.post('/register', registerCustomer)

router.get('/', getCustomers)

router.get('/:id', getCustomerById)
router.put('/:id', updateCustomer)
router.patch('/upadate-password/:id', updatePassword)
router.delete('/:id')

module.exports = router
