// src/routes/productRoutes.js
const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
const { addProduct, getProducts, getProductById, getMyProducts, updateProduct, deleteProduct } = require('../controllers/productController')
const authenticateUser = require('../middleware/authenticateUser')

router.post('/', authenticateUser, upload.single('image'), addProduct) // Only authenticated vendors can add products
router.get('/my-store', authenticateUser, getMyProducts)
router.put('/:id', authenticateUser, updateProduct)
router.get('/', getProducts)
router.get('/:id', getProductById)
router.delete('/:id', authenticateUser, deleteProduct)

module.exports = router
