const express = require('express')
const router = express.Router()
const { clickPesaWebhookHandler } = require('../controllers/webhookController')

router.post('/clickpesa', clickPesaWebhookHandler)

module.exports = router
