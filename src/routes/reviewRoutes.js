// src/routes/reviewRoutes.js
const express = require('express')
const router = express.Router()
const authenticateUser = require('../middleware/authenticateUser')
const { submitReview, getVendorReviews, editReview, deleteReview } = require('../controllers/reviewController')

router.post('/', authenticateUser, submitReview) // Only authenticated customers can leave a reviews
router.get('/:vendor_id', getVendorReviews)
router.put('/:review_id', authenticateUser, editReview)
router.delete('/:review_id', authenticateUser, deleteReview)
module.exports = router
