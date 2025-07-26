const express = require('express')
const router = express.Router()
const { createCart, getCart, updateCartItem, clearAndAddToCart, removeCartItem, updateCartItems } = require('../controllers/cartController')
const authOrGuest = require('../middleware/guestMiddleware')
const verifySessionTokenMiddleware = require('../middleware/verifySessionToken')
const authenticateUser = require('../middleware/authenticateUser')

router.post('/create-cart', verifySessionTokenMiddleware, authOrGuest, createCart)
router.post('/add-to-cart', verifySessionTokenMiddleware, authOrGuest, clearAndAddToCart)
router.get('/get-cart', verifySessionTokenMiddleware, authOrGuest, getCart)
router.put('/update-cart-items', verifySessionTokenMiddleware, authOrGuest, updateCartItem)
router.put('/update-quantities', verifySessionTokenMiddleware, authOrGuest, updateCartItems)
router.delete('/remove-item', verifySessionTokenMiddleware, authOrGuest, removeCartItem)
module.exports = router
