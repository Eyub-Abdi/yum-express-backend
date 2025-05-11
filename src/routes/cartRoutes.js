const express = require('express')
const router = express.Router()
const { createCart, getCart, updateCartItem, clearAndAddToCart } = require('../controllers/cartController')
const authOrGuest = require('../middleware/guestMiddleware')
const verifySessionTokenMiddleware = require('../middleware/verifySessionToken')
const authenticateUser = require('../middleware/authenticateUser')

router.post('/create-cart', authenticateUser, createCart)
router.post('/add-to-cart', authOrGuest, clearAndAddToCart)
router.get('/get-cart', authOrGuest, getCart)
router.put('/update-cart-items', authOrGuest, updateCartItem)
module.exports = router
