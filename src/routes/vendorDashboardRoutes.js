const express = require('express')
const router = express.Router()

const authenticateUser = require('../middleware/authenticateUser')
const vendorOnly = require('../middleware/vendorOnly')
const { getVendorDashboardOverview } = require('../controllers/getVendorDashboardOverview')

router.get('/overview', authenticateUser, vendorOnly, getVendorDashboardOverview)

module.exports = router
