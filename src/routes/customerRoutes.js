// src/routes/customerRoutes.js
const express = require('express')
const customerController = require('../controllers/customerController')

const router = express.Router()

// Register a customer
router.post('/register', customerController.registerCustomer)

router.get('/', customerController.getCustomers)

module.exports = router
