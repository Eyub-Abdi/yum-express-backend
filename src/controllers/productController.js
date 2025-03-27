const knex = require('../db/knex')
const { productSchema, productUpdateSchema } = require('../schemas/productSchema')
const { validateId } = require('../utils/validateId')

const addProduct = async (req, res) => {
  const vendor_id = req.user.id // Get the vendor ID from the authenticated user
  const { name, description, price, image_url, stock, is_available } = req.body

  // Validate request body
  const { error } = productSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  // Insert product into the database
  const [product] = await knex('products')
    .insert({
      vendor_id,
      name,
      description,
      price,
      image_url,
      stock,
      is_available,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning('*')

  res.status(201).json({ message: 'Product added successfully', product })
}

const getProducts = async (req, res) => {
  const products = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'stock', 'is_available', 'image_url', 'created_at', 'updated_at')

  res.json(products)
}

const getProductById = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  const product = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'stock', 'is_available', 'image_url', 'created_at', 'updated_at').where({ id }).first()

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  res.json(product)
}

const getMyProducts = async (req, res) => {
  const vendor_id = req.user.id // Get vendor ID from authenticated user

  const products = await knex('products').select('id', 'name', 'description', 'price', 'stock', 'is_available', 'image_url', 'created_at', 'updated_at').where({ vendor_id }) // Filter by vendor ID

  if (products.length === 0) {
    return res.status(404).json({ message: 'No products found for this vendor' })
  }

  res.json(products)
}

const updateProduct = async (req, res) => {
  const vendor_id = req.user.id // Authenticated vendor's ID
  const { id } = req.params

  // Validate product ID
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  // Validate request body
  const { error } = productUpdateSchema.validate(req.body, { allowUnknown: false })
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  // Check if the product exists and belongs to the vendor
  const product = await knex('products').where({ id, vendor_id }).first()
  if (!product) {
    return res.status(403).json({ message: 'You are not authorized to update this product or it does not exist' })
  }

  // Only allow specific fields to be updated
  const updateData = {}
  const { name, description, price, stock, is_available, image_url } = req.body
  if (name) updateData.name = name
  if (description) updateData.description = description
  if (price) updateData.price = price
  if (stock !== undefined) updateData.stock = stock // Handling for 0 values
  if (is_available !== undefined) updateData.is_available = is_available
  if (image_url) updateData.image_url = image_url

  updateData.updated_at = new Date()

  // Update the product
  const updatedProduct = await knex('products').where({ id }).update(updateData).returning('*')

  res.json({ message: 'Product updated successfully', product: updatedProduct[0] })
}

const deleteProduct = async (req, res) => {
  const vendor_id = req.user.id // Get the vendor ID from the authenticated user
  const { id } = req.params

  // Validate the product ID (to ensure it's a number)
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  // Check if the product exists and belongs to the vendor
  const product = await knex('products').where({ id, vendor_id }).first()
  if (!product) {
    return res.status(403).json({ message: 'You are not authorized to delete this product or it does not exist' })
  }

  // Proceed with deletion
  await knex('products').where({ id }).del()

  res.json({ message: 'Product deleted successfully' })
}

module.exports = { addProduct, getProducts, getProductById, getMyProducts, updateProduct, deleteProduct }
