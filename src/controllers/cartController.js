const knex = require('../db/knex')
const { generateSessionToken, generateSignature } = require('../utils/generateSessionToken')
const { cartItemSchema, cartItemUpdateSchema } = require('../schemas/cartItemSchema') // Import Joi schema from schemas directory

const createCart = async (req, res) => {
  const { sessionToken, user } = req
  let cartData = {}

  if (user) {
    // Authenticated user: Check if they already have an active cart
    const existingCart = await knex('carts').where({ customer_id: user.id }).andWhere('expires_at', '>', knex.fn.now()).first()

    if (existingCart) {
      return res.status(200).json({ cart: existingCart })
    }

    cartData.customer_id = user.id
  } else {
    // Guest user
    let existingCart = null
    if (sessionToken) {
      existingCart = await knex('carts').where({ session_token: sessionToken }).andWhere('expires_at', '>', knex.fn.now()).first()
    }

    if (existingCart) {
      return res.status(200).json({ cart: existingCart })
    }

    // Generate session token if not present
    const newSessionToken = sessionToken || generateSessionToken()
    cartData.session_token = newSessionToken

    // Generate signature for session token
    const signature = generateSignature(newSessionToken)
    cartData.signature = signature

    // Set cookie
    res.cookie('session_token', newSessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
  }

  cartData.expires_at = knex.raw("CURRENT_TIMESTAMP + INTERVAL '7 days'")

  const [cart] = await knex('carts').insert(cartData).returning('*')

  return res.status(201).json({ cart })
}

const clearAndAddToCart = async (req, res) => {
  const { cart_id, product_id, quantity, force = false } = req.body
  const { sessionToken, user } = req

  // Validate input
  const { error } = cartItemSchema.validate({ cart_id, product_id, quantity })
  if (error) return res.status(400).json({ error: error.details[0].message })

  // Fetch cart and verify ownership
  const cart = user ? await knex('carts').where({ id: cart_id, customer_id: user.id }).first() : await knex('carts').where({ id: cart_id, session_token: sessionToken }).first()

  if (!cart) return res.status(404).json({ error: 'Cart not found' })

  // Fetch product and its vendor
  const product = await knex('products').join('vendors', 'products.vendor_id', 'vendors.id').select('products.*', 'vendors.id as vendor_id', 'vendors.business_name as vendor_name').where('products.id', product_id).first()

  if (!product) return res.status(404).json({ error: 'Product not found' })
  if (quantity > product.stock) return res.status(400).json({ error: 'Not enough stock available' })

  // Check if cart already contains items from a different vendor
  const cartItems = await knex('cart_items').join('products', 'cart_items.product_id', 'products.id').join('vendors', 'products.vendor_id', 'vendors.id').where('cart_items.cart_id', cart.id).select('products.vendor_id', 'vendors.business_name as vendor_name')

  const conflictingItem = cartItems.find(item => item.vendor_id !== product.vendor_id)

  if (conflictingItem && !force) {
    return res.status(409).json({
      message: `This will clear your cart from another vendor (${conflictingItem.vendor_name}). Proceed?`,
      vendorConflict: true
    })
  }

  if (conflictingItem && force) {
    await knex('cart_items').where({ cart_id }).del()
  }

  // Check if product already exists in the cart (after clear, or no conflict)
  const existingItem = await knex('cart_items').where({ cart_id, product_id }).first()

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity
    if (newQuantity > product.stock) return res.status(400).json({ error: 'Not enough stock available' })

    await knex('cart_items').where({ cart_id, product_id }).update({ quantity: newQuantity, updated_at: knex.fn.now() })

    return res.status(200).json({ message: 'Cart updated successfully' })
  }

  // Insert new item
  await knex('cart_items').insert({ cart_id, product_id, quantity })

  return res.status(200).json({ message: 'Item added to cart' })
}

const getCart = async (req, res) => {
  const { sessionToken, user } = req
  let cart

  if (user) {
    // Authenticated user: Get their active cart
    cart = await knex('carts').where({ customer_id: user.id }).andWhere('expires_at', '>', knex.fn.now()).first()
  } else if (sessionToken) {
    // Guest user: Get their active cart
    cart = await knex('carts').where({ session_token: sessionToken }).andWhere('expires_at', '>', knex.fn.now()).first()
  }

  if (!cart) {
    return res.status(200).json({ cart: null, items: [] }) // Return empty cart
  }

  // Fetch cart items with product details
  const cartItems = await knex('cart_items').where({ cart_id: cart.id }).join('products', 'cart_items.product_id', 'products.id').select(
    'cart_items.id',
    'cart_items.product_id',
    'cart_items.quantity',
    'products.name',
    'products.vendor_id',
    'products.price',
    'products.image_url' // Include image_url here
  )

  return res.status(200).json({ cart, items: cartItems })
}

const updateCartItem = async (req, res) => {
  const { cart_id, product_id, quantity } = req.body
  const { sessionToken, user } = req

  // Validate input
  const { error } = cartItemUpdateSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  // Verify cart ownership
  const cart = user ? await knex('carts').where({ id: cart_id, customer_id: user.id }).first() : await knex('carts').where({ id: cart_id, session_token: sessionToken }).first()

  if (!cart) return res.status(404).json({ error: 'Cart not found' })

  // Check if the cart item exists
  const existingItem = await knex('cart_items').where({ cart_id, product_id }).first()
  if (!existingItem) return res.status(404).json({ error: 'Cart item not found' })

  if (quantity > 0) {
    const product = await knex('products').where({ id: product_id }).first()
    if (!product) return res.status(404).json({ error: 'Product not found' })
    if (quantity > product.stock) return res.status(400).json({ error: 'Not enough stock available' })

    await knex('cart_items').where({ cart_id, product_id }).update({
      quantity,
      updated_at: knex.fn.now()
    })

    return res.status(200).json({ message: 'Cart item updated successfully' })
  }

  // Quantity is 0, remove item
  await knex('cart_items').where({ cart_id, product_id }).del()
  return res.status(200).json({ message: 'Cart item removed successfully' })
}

module.exports = { createCart, clearAndAddToCart, getCart, updateCartItem }
