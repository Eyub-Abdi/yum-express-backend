const express = require('express')
const router = express.Router()
const { verifyOtp } = require('../controllers/verifyOtp')

router.post('/:entity/verify-otp', (req, res) => {
  const { entity } = req.params
  verifyOtp(entity, req, res)
})

module.exports = router
