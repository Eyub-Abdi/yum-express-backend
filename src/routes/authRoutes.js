const express = require('express')
const router = express.Router()
const { loginCustomer } = require('../controllers/customerAuth')
const { loginVendor } = require('../controllers/vendorAuth')
const { loginAdmin } = require('../controllers/adminAuth')

router.post('/customers/login', loginCustomer)
router.post('/vendors/login', loginVendor)
router.post('/admins/login', loginAdmin)

module.exports = router
