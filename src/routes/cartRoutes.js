const express = require('express')
const router = express.Router()
const { createCart } = require('../controllers/cartController')
const authOrGuest = require('../middleware/guestMiddleware')
const verifySessionTokenMiddleware = require('../middleware/verifySessionToken')

router.post('/create-cart', verifySessionTokenMiddleware, authOrGuest, createCart)

module.exports = router
