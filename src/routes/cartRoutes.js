const express = require('express')
const router = express.Router()
const { createCart, addToCart, getCart, updateCartItem } = require('../controllers/cartController')
const authOrGuest = require('../middleware/guestMiddleware')
const verifySessionTokenMiddleware = require('../middleware/verifySessionToken')

router.post('/create-cart', verifySessionTokenMiddleware, authOrGuest, createCart)
router.post('/add-to-cart', authOrGuest, addToCart)
router.get('/', authOrGuest, getCart)
router.put('/update-cart-item', updateCartItem)
module.exports = router
