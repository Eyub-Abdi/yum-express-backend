const { getStore } = require('../controllers/storeController')

const router = require('express').Router()

router.get('/:id', getStore)

module.exports = router
