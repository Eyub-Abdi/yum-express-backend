const knex = require('../db/knex')
const { adminProductQuerySchema } = require('../schemas/adminProductQuerySchema')

const getAllProductsForAdmin = async (req, res) => {
  const { error, value } = adminProductQuerySchema.validate(req.query)

  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { page, limit, search, vendor_id, is_available, min_price, max_price, sort } = value

  const offset = (page - 1) * limit

  const baseQuery = knex('products').join('vendors', 'products.vendor_id', 'vendors.id')

  if (search) {
    baseQuery.whereILike('products.name', `%${search}%`)
  }

  if (vendor_id) {
    baseQuery.andWhere('products.vendor_id', vendor_id)
  }

  if (is_available !== undefined) {
    baseQuery.andWhere('products.is_available', is_available === 'true')
  }

  if (min_price) {
    baseQuery.andWhere('products.price', '>=', min_price)
  }

  if (max_price) {
    baseQuery.andWhere('products.price', '<=', max_price)
  }

  // Total count query
  const totalQuery = baseQuery.clone().clearSelect().clearOrder().count('products.id as count')
  const totalResult = await totalQuery.first()
  const total = Number(totalResult.count)

  // Main product query with selected fields
  const query = baseQuery.clone().select('products.id', 'products.name', 'products.description', 'products.price', 'products.stock', 'products.is_available', 'products.image_url', 'products.created_at', 'vendors.id as vendor_id', 'vendors.business_name as vendor_name')

  // Sorting
  switch (sort) {
    case 'price_asc':
      query.orderBy('products.price', 'asc')
      break
    case 'price_desc':
      query.orderBy('products.price', 'desc')
      break
    case 'name_asc':
      query.orderBy('products.name', 'asc')
      break
    case 'name_desc':
      query.orderBy('products.name', 'desc')
      break
    case 'oldest':
      query.orderBy('products.created_at', 'asc')
      break
    case 'newest':
    default:
      query.orderBy('products.created_at', 'desc')
      break
  }

  const products = await query.limit(limit).offset(offset)

  res.json({
    page,
    limit,
    total,
    products
  })
}

module.exports = { getAllProductsForAdmin }
