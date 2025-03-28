// src/routes/reviewRoutes.js
const express = require('express')
const router = express.Router()
const authenticateUser = require('../middleware/authenticateUser')
const { submitReview } = require('../controllers/reviewController')

router.post('/', submitReview) // Only authenticated customers can leave a reviews

module.exports = router
