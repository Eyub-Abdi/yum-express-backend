const express = require('express')
const router = express.Router()
const { createCart, getCart, updateCartItem, clearAndAddToCart } = require('../controllers/cartController')
const authOrGuest = require('../middleware/guestMiddleware')
const verifySessionTokenMiddleware = require('../middleware/verifySessionToken')

router.post('/create-cart', authOrGuest, createCart)
router.post('/add-to-cart', authOrGuest, clearAndAddToCart)
router.get('/', authOrGuest, getCart)
router.put('/update-cart-item', updateCartItem)
module.exports = router
