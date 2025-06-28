// src/routes/productRoutes.js
const express = require('express')
const router = express.Router()
const { addProduct, getProducts, getProductById, getMyProducts, getMyProductById, updateProduct, deleteProduct } = require('../controllers/productController')
const authenticateUser = require('../middleware/authenticateUser')
const getUploadMiddleware = require('../middleware/upload')
const uploadProductImage = getUploadMiddleware('images')

router.post('/', authenticateUser, uploadProductImage.single('image'), addProduct) // Only authenticated vendors can add products
router.get('/my-store', authenticateUser, getMyProducts)
router.get('/mine/:id', authenticateUser, getMyProductById)

router.put('/:id', authenticateUser, uploadProductImage.single('image'), updateProduct)
router.get('/', getProducts)
router.get('/:id', getProductById)
router.delete('/:id', authenticateUser, deleteProduct)

module.exports = router
