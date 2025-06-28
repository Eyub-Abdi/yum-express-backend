// routes/supportRoutes.js
const express = require('express')
const router = express.Router()
const { sendSupportEmail } = require('../controllers/sendSupportEmail')

router.post('/send', sendSupportEmail)

module.exports = router
