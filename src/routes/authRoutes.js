const express = require('express')
const router = express.Router()
const { loginCustomer } = require('../controllers/customerAuth')
const { loginVendor } = require('../controllers/vendorAuth')
const { loginAdmin } = require('../controllers/adminAuth')
const { loginDriver } = require('../controllers/driverAuth')
const { forgotPassword } = require('../controllers/forgotPassword')
const { resetPassword } = require('../controllers/resetPassword')

router.post('/customers/login', loginCustomer)
router.post('/vendors/login', loginVendor)
router.post('/admins/login', loginAdmin)
router.post('/drivers/login', loginDriver)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router
