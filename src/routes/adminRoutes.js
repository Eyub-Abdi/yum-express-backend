// routes/adminRoutes.js
const express = require('express')
const router = express.Router()
const { registerAdmin, verifyAdminEmail } = require('../controllers/adminController')

// POST /admins/register
router.post('/register', registerAdmin)
router.get('/verify-email', verifyAdminEmail)

module.exports = router
