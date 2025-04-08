const express = require('express')
const { getVendorWeeklySales, getMonthlyVendorSales } = require('../controllers/salesController')
const authenticateUser = require('../middleware/authenticateUser')
const router = express.Router()

router.get('/vendor/weekly', authenticateUser, getVendorWeeklySales)
router.get('/vendor/monthly', authenticateUser, getMonthlyVendorSales)

module.exports = router
