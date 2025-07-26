const express = require('express')
const router = express.Router()
const { createCart, getCart, updateCartItem, clearAndAddToCart, removeCartItem, updateCartItems } = require('../controllers/cartController')
const authOrGuest = require('../middleware/guestMiddleware')
const verifySessionTokenMiddleware = require('../middleware/verifySessionToken')
const authenticateUser = require('../middleware/authenticateUser')

router.post('/create-cart', authOrGuest, verifySessionTokenMiddleware, createCart)
router.post('/add-to-cart', authOrGuest, verifySessionTokenMiddleware, clearAndAddToCart)
router.get('/get-cart', authOrGuest, verifySessionTokenMiddleware, getCart)
router.put('/update-cart-items', authOrGuest, verifySessionTokenMiddleware, updateCartItem)
router.put('/update-quantities', authOrGuest, verifySessionTokenMiddleware, updateCartItems)
router.delete('/remove-item', authOrGuest, verifySessionTokenMiddleware, removeCartItem)
module.exports = router
