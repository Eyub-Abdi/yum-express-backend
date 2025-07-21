const knex = require('../db/knex')
const { productSchema, productUpdateSchema, productQuerySchema, maxOrderQuantitySchema, publishStatusSchema } = require('../schemas/productSchema')
const { validateId } = require('../utils/validateId')
const path = require('path')
const fs = require('fs')

const addProduct = async (req, res) => {
  const vendor_id = req.user.id
  const { name, description, price, stock, is_available } = req.body
  const image_url = req.file?.filename

  const { error } = productSchema.validate({ ...req.body, image_url })
  if (error) return res.status(400).json({ error: error.details[0].message })

  const [product] = await knex('products')
    .insert({
      vendor_id,
      name,
      description,
      price,
      image_url,
      stock,
      is_disabled: false,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning('*')

  res.status(201).json({ message: 'Product added successfully', product })
}

// const getProducts = async (req, res) => {
//   // Validate query parameters
//   const { error, value } = productQuerySchema.validate(req.query)
//   if (error) {
//     return res.status(400).json({ message: error.details[0].message })
//   }

//   const { category, min_price, max_price, sort, page, limit, in_stock } = value

//   let query = knex('products').select('*')

//   if (category) query = query.where('category', category)
//   if (min_price) query = query.where('price', '>=', min_price)
//   if (max_price) query = query.where('price', '<=', max_price)
//   if (in_stock === 'true') query = query.where('stock', '>', 0)

//   const sortOptions = {
//     price_asc: ['price', 'asc'],
//     price_desc: ['price', 'desc'],
//     name_asc: ['name', 'asc'],
//     name_desc: ['name', 'desc'],
//     newest: ['created_at', 'desc'],
//     oldest: ['created_at', 'asc']
//   }
//   if (sort) query = query.orderBy(...sortOptions[sort])

//   const offset = (page - 1) * limit
//   query = query.limit(limit).offset(offset)

//   const products = await query
//   res.json(products)
// }

const getProducts = async (req, res) => {
  // Validate query parameters
  const { error, value } = productQuerySchema.validate(req.query)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { category, min_price, max_price, sort, page, limit, in_stock } = value

  let query = knex('products').select('*')

  // Only fetch products that are not disabled and published
  query = query.where({ is_disabled: false, is_published: true })

  if (category) query = query.where('category', category)
  if (min_price) query = query.where('price', '>=', min_price)
  if (max_price) query = query.where('price', '<=', max_price)
  if (in_stock === 'true') query = query.where('stock', '>', 0)

  const sortOptions = {
    price_asc: ['price', 'asc'],
    price_desc: ['price', 'desc'],
    name_asc: ['name', 'asc'],
    name_desc: ['name', 'desc'],
    newest: ['created_at', 'desc'],
    oldest: ['created_at', 'asc']
  }
  if (sort) query = query.orderBy(...sortOptions[sort])

  const offset = (page - 1) * limit
  query = query.limit(limit).offset(offset)

  const products = await query
  res.json(products)
}

// const getProductById = async (req, res) => {
//   const { id } = req.params

//   if (!validateId(id)) {
//     return res.status(400).json({ message: 'Invalid ID format' })
//   }

//   const product = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'stock', 'is_disabled', 'max_order_quantity', 'image_url', 'created_at', 'updated_at').where({ id }).first()

//   if (!product) {
//     return res.status(404).json({ message: 'Product not found' })
//   }

//   res.json(product)
// }

const getProductById = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  const product = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'stock', 'is_disabled', 'is_published', 'max_order_quantity', 'image_url', 'created_at', 'updated_at').where({ id, is_disabled: false, is_published: true }).first()

  if (!product) {
    return res.status(404).json({ message: 'Product not found or not available' })
  }

  res.json(product)
}

// const getMyProducts = async (req, res) => {
//   const vendor_id = req.user.id // Get vendor ID from authenticated user

//   const products = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'stock', 'is_disabled', 'max_order_quantity', 'image_url', 'created_at', 'updated_at').where({ vendor_id }) // Filter by vendor ID

//   if (products.length === 0) {
//     return res.status(404).json({ message: 'No products found for this vendor' })
//   }

//   res.json(products)
// }

const DAY_IN_MS = 24 * 60 * 60 * 1000
const NEW_PRODUCT_DAYS = 4

const getMyProducts = async (req, res) => {
  const vendor_id = req.user.id // Get vendor ID from authenticated user

  // Get top 5 best-selling product IDs for this vendor
  const bestSaleProductIds = await knex('order_items').join('orders', 'order_items.order_id', 'orders.id').where('orders.vendor_id', vendor_id).groupBy('order_items.product_id').orderByRaw('SUM(order_items.quantity) DESC').limit(5).pluck('product_id')

  // Fetch all vendor products, no filter on is_disabled or is_published
  const products = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'stock', 'is_disabled', 'is_published', 'max_order_quantity', 'image_url', 'created_at', 'updated_at').where({ vendor_id })

  if (products.length === 0) {
    return res.status(404).json({ message: 'No products found for this vendor' })
  }

  const now = Date.now()

  // Add derived fields is_new and is_best_sale
  const enhancedProducts = products.map(product => {
    const isNew = now - new Date(product.created_at).getTime() <= NEW_PRODUCT_DAYS * DAY_IN_MS
    const isBestSale = bestSaleProductIds.includes(product.id)
    return {
      ...product,
      is_new: isNew,
      is_best_sale: isBestSale
    }
  })

  res.json(enhancedProducts)
}

const getMyProductById = async (req, res) => {
  const vendor_id = req.user.id
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  const product = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'stock', 'is_disabled', 'max_order_quantity', 'image_url', 'created_at', 'updated_at', 'deleted_at', 'deleted_by').where({ id, vendor_id }).first()

  if (!product) {
    return res.status(404).json({ message: 'Product not found or unauthorized access' })
  }

  res.json(product)
}

const updateMaxOrderQuantity = async (req, res) => {
  const vendor_id = req.user.id
  const { id } = req.params

  // Validate ID format
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid product ID format' })
  }

  // Validate body using Joi
  const { error, value } = maxOrderQuantitySchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { max_order_quantity } = value

  // Confirm product belongs to vendor
  const product = await knex('products').select('id').where({ id, vendor_id }).first()

  if (!product) {
    return res.status(404).json({ message: 'Product not found or unauthorized access' })
  }

  // Update max_order_quantity
  await knex('products').where({ id }).update({
    max_order_quantity,
    updated_at: new Date()
  })

  res.json({ message: 'Max order quantity updated successfully' })
}

// const updateProduct = async (req, res) => {
//   const vendor_id = req.user.id // Authenticated vendor's ID
//   const { id } = req.params

//   // Validate product ID
//   if (!validateId(id)) {
//     return res.status(400).json({ message: 'Invalid ID format' })
//   }

//   // Validate request body
//   const { error } = productUpdateSchema.validate(req.body, { allowUnknown: false })
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message })
//   }

//   // Check if the product exists and belongs to the vendor
//   const product = await knex('products').where({ id, vendor_id }).first()
//   if (!product) {
//     return res.status(403).json({ message: 'You are not authorized to update this product or it does not exist' })
//   }

//   // Only allow specific fields to be updated
//   const updateData = {}
//   const { name, description, price, stock, is_available, image_url } = req.body
//   if (name) updateData.name = name
//   if (description) updateData.description = description
//   if (price) updateData.price = price
//   if (stock !== undefined) updateData.stock = stock // Handling for 0 values
//   if (is_available !== undefined) updateData.is_available = is_available
//   if (image_url) updateData.image_url = image_url

//   updateData.updated_at = new Date()

//   // Update the product
//   const updatedProduct = await knex('products').where({ id }).update(updateData).returning('*')

//   res.json({ message: 'Product updated successfully', product: updatedProduct[0] })
// }

const updateProduct = async (req, res) => {
  const vendor_id = req.user.id // Authenticated vendor's ID
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  const { error } = productUpdateSchema.validate(req.body, { allowUnknown: false })
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const product = await knex('products').where({ id, vendor_id }).first()
  if (!product) {
    return res.status(403).json({ message: 'You are not authorized to update this product or it does not exist' })
  }

  const updateData = {}
  const { name, description, price, stock, is_disabled } = req.body
  if (name) updateData.name = name
  if (description) updateData.description = description
  if (price) updateData.price = price
  if (stock !== undefined) updateData.stock = stock
  // if (is_available !== undefined) updateData.is_disabled = is_disabled

  // === Handle Image Replacement ===
  if (req.file) {
    // Delete the old image if it exists
    if (product.image_url) {
      const oldImagePath = path.join(__dirname, '..', '..', 'public', product.image_url)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }

    // Save new image path (match what you use in frontend)
    updateData.image_url = `${req.file.filename}`
  }

  updateData.updated_at = new Date()

  const updatedProduct = await knex('products').where({ id }).update(updateData).returning('*')

  res.json({ message: 'Product updated successfully', product: updatedProduct[0] })
}

const updatePublishStatus = async (req, res) => {
  const vendor_id = req.user.id
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid product ID' })
  }

  const { error, value } = publishStatusSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const product = await knex('products').where({ id, vendor_id }).first()

  if (!product) {
    return res.status(404).json({ message: 'Product not found or unauthorized' })
  }

  await knex('products').where({ id, vendor_id }).update({ is_published: value.is_published, updated_at: new Date() })

  res.json({ message: `Product ${value.is_published ? 'published' : 'unpublished'} successfully` })
}

const deleteProduct = async (req, res) => {
  const vendor_id = req.user.id
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  const product = await knex('products').where({ id, vendor_id }).first()
  if (!product) {
    return res.status(403).json({ message: 'You are not authorized to delete this product or it does not exist' })
  }

  // Full path to image based on multer config
  const imagePath = path.join(__dirname, '..', '..', 'public', 'assets', 'images', product.image_url)

  // Delete image from disk
  fs.unlink(imagePath, err => {
    if (err) {
      console.error('Failed to delete product image:', err.message)
      // Proceed even if the image is not found
    }
  })

  await knex('products').where({ id }).del()

  res.json({ message: 'Product deleted successfully' })
}

module.exports = { addProduct, getProducts, getProductById, getMyProducts, getMyProductById, updateProduct, updateMaxOrderQuantity, updatePublishStatus, deleteProduct }
