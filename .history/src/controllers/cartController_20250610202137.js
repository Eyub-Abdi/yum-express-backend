const knex = require('../db/knex')
const { generateSessionToken, generateSignature } = require('../utils/generateSessionToken')
const { cartItemSchema, cartItemUpdateSchema, cartItemRemoveSchema, updateCartItemsSchema } = require('../schemas/cartItemSchema') // Import Joi schema from schemas directory

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
  const { error } = cartItemSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  // Fetch cart and verify ownership
  const cart = user ? await knex('carts').where({ id: cart_id, customer_id: user.id }).first() : await knex('carts').where({ id: cart_id, session_token: sessionToken }).first()

  if (!cart) return res.status(404).json({ error: 'Cart not found' })

  // Fetch product and its vendor
  const product = await knex('products').join('vendors', 'products.vendor_id', 'vendors.id').select('products.*', 'vendors.id as vendor_id', 'vendors.business_name as vendor_name').where('products.id', product_id).first()

  if (!product) return res.status(404).json({ error: 'Product not found' })
  if (quantity > product.stock) return res.status(400).json({ error: 'Not enough stock available' })

  // Check if cart already contains items from a different vendor
  const cartItems = await knex('cart_items').join('products', 'cart_items.product_id', 'products.id').join('vendors', 'products.vendor_id', 'vendors.id').where('cart_items.cart_id', cart.id).select('products.vendor_id')

  // Check if there are conflicting items in the cart from a different vendor
  const conflictingItem = cartItems.find(item => item.vendor_id !== product.vendor_id)

  if (conflictingItem && !force) {
    return res.status(409).json({
      message: `This will clear your cart from another vendor. Proceed?`,
      vendorConflict: true
    })
  }

  // If there is a vendor conflict and force is true, clear the cart first
  if (conflictingItem && force) {
    await knex('cart_items').where({ cart_id }).del()
  }

  // Check if the product already exists in the cart (after clear or no conflict)
  const existingItem = await knex('cart_items').where({ cart_id, product_id }).first()

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity
    if (newQuantity > product.stock) return res.status(400).json({ error: 'Not enough stock available' })

    await knex('cart_items').where({ cart_id, product_id }).update({ quantity: newQuantity, updated_at: knex.fn.now() })

    // Return the updated cart information
    const updatedCart = await knex('carts').where({ id: cart_id }).first()
    const updatedItems = await knex('cart_items').where({ cart_id }).join('products', 'cart_items.product_id', 'products.id').select('cart_items.*', 'products.name', 'products.price', 'products.image_url', 'products.vendor_id')

    return res.status(200).json({
      message: 'Cart updated successfully',
      cart: updatedCart,
      items: updatedItems,
      vendorId: updatedItems[0]?.vendor_id || null,
      summary: {
        subtotal: updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
        total: updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0) // Add logic for tax, shipping, etc.
      }
    })
  }

  // Insert new item if it doesn't already exist in the cart
  await knex('cart_items').insert({ cart_id, product_id, quantity })

  // Return the updated cart information
  const updatedCart = await knex('carts').where({ id: cart_id }).first()
  const updatedItems = await knex('cart_items').where({ cart_id }).join('products', 'cart_items.product_id', 'products.id').select('cart_items.*', 'products.name', 'products.price', 'products.image_url', 'products.vendor_id')

  return res.status(200).json({
    message: 'Item added to cart',
    cart: updatedCart,
    items: updatedItems,
    vendorId: updatedItems[0]?.vendor_id || null,
    summary: {
      subtotal: updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      total: updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0) // Add logic for tax, shipping, etc.
    }
  })
}

const getCart = async (req, res) => {
  const { sessionToken, user } = req
  let cart

  if (user) {
    cart = await knex('carts').where({ customer_id: user.id }).andWhere('expires_at', '>', knex.fn.now()).first()
  } else if (sessionToken) {
    cart = await knex('carts').where({ session_token: sessionToken }).andWhere('expires_at', '>', knex.fn.now()).first()
  }

  if (!cart) {
    return res.status(200).json({
      cart: null,
      items: [],
      subtotal: 0,
      total: 0,
      message: 'Cart is empty'
    })
  }

  const cartItems = await knex('cart_items').where({ cart_id: cart.id }).join('products', 'cart_items.product_id', 'products.id').select('cart_items.id', 'cart_items.product_id', 'cart_items.quantity', 'products.name', 'products.vendor_id', 'products.price', 'products.max_order_quantity', 'products.image_url')

  // 🧮 Calculate subtotal (sum of item prices * quantity)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Optional: Add delivery/tax/discounts logic here
  const deliveryFee = 0 // example
  const total = subtotal + deliveryFee

  return res.status(200).json({
    cart,
    items: cartItems,
    summary: {
      subtotal,
      total
    }
  })
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

const updateCartItems = async (req, res) => {
  const { cart_id, items } = req.body
  const { sessionToken, user } = req

  // Validate request body
  const { error } = updateCartItemsSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  // Verify cart ownership
  const cart = user ? await knex('carts').where({ id: cart_id, customer_id: user.id }).first() : await knex('carts').where({ id: cart_id, session_token: sessionToken }).first()

  if (!cart) return res.status(404).json({ error: 'Cart not found' })

  try {
    await knex.transaction(async trx => {
      for (const item of items) {
        const { product_id, quantity } = item

        const existingItem = await trx('cart_items').where({ cart_id, product_id }).first()
        if (!existingItem) continue // Skip if not in cart

        const product = await trx('products').where({ id: product_id }).first()
        if (!product) throw new Error(`Product with ID ${product_id} not found`)

        if (quantity === 0) {
          await trx('cart_items').where({ cart_id, product_id }).del()
          continue
        }

        if (quantity > product.stock) {
          throw new Error(`Not enough stock for "${product.name}". Available: ${product.stock}`)
        }

        await trx('cart_items').where({ cart_id, product_id }).update({
          quantity,
          updated_at: knex.fn.now()
        })
      }
    })

    // Fetch updated cart items
    const updatedItems = await knex('cart_items').where({ cart_id }).join('products', 'cart_items.product_id', 'products.id').select('cart_items.product_id', 'cart_items.quantity', 'products.name', 'products.price', 'products.image_url', 'products.max_order_quantity', 'products.vendor_id')

    // Calculate summary
    const subtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const deliveryFee = 0
    const summary = {
      subtotal,
      total: subtotal + deliveryFee // Update if tax/shipping/discounts are applied
    }

    return res.status(200).json({
      message: 'Cart updated successfully',
      cart,
      items: updatedItems,
      summary
    })
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err.message || 'Failed to update cart items' })
  }
}

const removeCartItem = async (req, res) => {
  const { cart_id, product_id } = req.body
  const { sessionToken, user } = req

  const { error } = cartItemRemoveSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const cart = user ? await knex('carts').where({ id: cart_id, customer_id: user.id }).first() : await knex('carts').where({ id: cart_id, session_token: sessionToken }).first()

  if (!cart) return res.status(404).json({ error: 'Cart not found' })

  const existingItem = await knex('cart_items').where({ cart_id, product_id }).first()
  if (!existingItem) return res.status(404).json({ error: 'Cart item not found' })

  await knex('cart_items').where({ cart_id, product_id }).del()

  // Reuse existing logic to return updated cart
  return getCart(req, res)
}

module.exports = { createCart, clearAndAddToCart, getCart, updateCartItem, updateCartItems, removeCartItem }
