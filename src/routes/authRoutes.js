const express = require('express')
const router = express.Router()
const { loginCustomer } = require('../controllers/customerAuth')
// const { loginVendor } = require('../controllers/vendorController')

router.post('/customers/login', loginCustomer)
// router.post('/vendors/login', loginVendor)

module.exports = router
