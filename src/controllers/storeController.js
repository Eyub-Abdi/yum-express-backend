const knex = require('../db/knex')
const { validateId } = require('../utils/validateId')

// const getStore = async (req, res) => {
//   const { id } = req.params

//   if (!validateId(id)) {
//     return res.status(400).json({ message: 'Invalid vendor ID format' })
//   }

//   const vendor = await knex('vendors').select('id', 'email', 'business_name', 'phone', 'banner', 'created_at').where({ id }).first()

//   if (!vendor) {
//     return res.status(404).json({ message: 'Vendor not found' })
//   }

//   const products = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'image_url', 'stock', 'max_order_quantity', 'is_disabled', 'created_at').where({ vendor_id: id, is_disabled: false })

//   const reviewStats = await knex('reviews').where({ vendor_id: id }).avg('rating as average_rating').count('id as total_reviews').first()

//   const average_rating = reviewStats.average_rating ? Number(parseFloat(reviewStats.average_rating).toFixed(1)) : 0

//   const total_reviews = reviewStats.total_reviews ? parseInt(reviewStats.total_reviews, 10) : 0

//   res.json({
//     vendor,
//     products,
//     reviews: {
//       average_rating,
//       total_reviews
//     }
//   })
// }
const getStore = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid vendor ID format' })
  }

  const vendor = await knex('vendors').select('id', 'email', 'business_name', 'phone', 'banner', 'created_at').where({ id }).first()

  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  const products = await knex('products').select('id', 'vendor_id', 'name', 'description', 'price', 'image_url', 'stock', 'max_order_quantity', 'is_disabled', 'is_published', 'created_at').where({ vendor_id: id, is_disabled: false, is_published: true })

  const reviewStats = await knex('reviews').where({ vendor_id: id }).avg('rating as average_rating').count('id as total_reviews').first()

  const average_rating = reviewStats.average_rating ? Number(parseFloat(reviewStats.average_rating).toFixed(1)) : 0
  const total_reviews = reviewStats.total_reviews ? parseInt(reviewStats.total_reviews, 10) : 0

  res.json({
    vendor,
    products,
    reviews: {
      average_rating,
      total_reviews
    }
  })
}

module.exports = { getStore }
