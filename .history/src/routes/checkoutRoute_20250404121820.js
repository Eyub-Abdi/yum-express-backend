const express = require('express')
const router = express.Router()

// Import the checkoutCart controller
const { checkoutCart } = require('../controllers/checkoutController')
const authenticateUser = require('../middleware/authenticateUser')

// Checkout route
router.post('/', authenticateUser, checkoutCart)

module.exports = router
