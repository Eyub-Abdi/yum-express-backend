// const knex = require('../db/knex')

// const getVendorDashboardOverview = async (req, res) => {
//   const vendor_id = req.user.id

//   // 1. Total products
//   const totalProducts = await knex('products').where({ vendor_id }).count('id as count').first()

//   // 2. Published products
//   const publishedProducts = await knex('products').where({ vendor_id, is_published: true }).count('id as count').first()

//   // 3. Unpublished products
//   const unpublishedProducts = await knex('products').where({ vendor_id, is_published: false }).count('id as count').first()

//   // 4. Best selling products (top 5)
//   const bestSellingProducts = await knex('order_items').join('orders', 'order_items.order_id', 'orders.id').where('orders.vendor_id', vendor_id).groupBy('order_items.product_id').select('order_items.product_id').orderByRaw('SUM(order_items.quantity) DESC').limit(100)

//   // 5. Total orders
//   const totalOrders = await knex('orders').where({ vendor_id }).count('id as count').first()

//   // 6. New orders (pending)
//   const newOrders = await knex('orders').where({ vendor_id }).andWhere('order_status', 'pending').count('id as count').first()

//   // 7. Orders in transit
//   const inTransitOrders = await knex('orders').where({ vendor_id }).andWhere('order_status', 'on_the_way').count('id as count').first()

//   // 8. Delivered this month (via `deliveries` table)
//   const startOfMonth = new Date()
//   startOfMonth.setDate(1)
//   startOfMonth.setHours(0, 0, 0, 0)

//   const deliveredThisMonth = await knex('deliveries').where({ vendor_id }).andWhere('status', 'delivered').andWhere('delivered_at', '>=', startOfMonth).count('id as count').first()

//   // 9. Revenue this month (from delivered orders)
//   const revenue = await knex('deliveries').join('orders', 'deliveries.order_id', 'orders.id').where('deliveries.vendor_id', vendor_id).andWhere('deliveries.status', 'delivered').andWhere('deliveries.delivered_at', '>=', startOfMonth).sum('orders.total_price as total').first()

//   res.json({
//     products: {
//       total: parseInt(totalProducts.count),
//       published: parseInt(publishedProducts.count),
//       unpublished: parseInt(unpublishedProducts.count),
//       best_selling_count: bestSellingProducts.length
//     },
//     orders: {
//       total: parseInt(totalOrders.count),
//       new: parseInt(newOrders.count),
//       in_transit: parseInt(inTransitOrders.count),
//       delivered_this_month: parseInt(deliveredThisMonth.count)
//     },
//     revenue: {
//       total: parseInt(revenue.total) || 0
//     }
//   })
// }

// module.exports = { getVendorDashboardOverview }

const knex = require('../db/knex')

const getVendorDashboardOverview = async (req, res) => {
  const vendor_id = req.user.id

  // Get start of this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // 1. Total products
  const totalProducts = await knex('products').where({ vendor_id }).count('id as count').first()

  // 2. Published products
  const publishedProducts = await knex('products').where({ vendor_id, is_published: true }).count('id as count').first()

  // 3. Unpublished products
  const unpublishedProducts = await knex('products').where({ vendor_id, is_published: false }).count('id as count').first()

  // 4. Best selling products (top 100 for now)
  const bestSellingProducts = await knex('order_items').join('orders', 'order_items.order_id', 'orders.id').where('orders.vendor_id', vendor_id).groupBy('order_items.product_id').select('order_items.product_id').orderByRaw('SUM(order_items.quantity) DESC').limit(100)

  // 5. Total orders
  const totalOrders = await knex('orders').where({ vendor_id }).count('id as count').first()

  // 6. New orders
  const newOrders = await knex('orders').where({ vendor_id }).andWhere('order_status', 'pending').count('id as count').first()

  // 7. Orders in transit
  const inTransitOrders = await knex('orders').where({ vendor_id }).andWhere('order_status', 'on_the_way').count('id as count').first()

  // 8. Delivered orders this month (from deliveries)
  const deliveredThisMonth = await knex('deliveries').where({ vendor_id }).andWhere('status', 'delivered').andWhere('delivered_at', '>=', startOfMonth).count('id as count').first()

  // 9. Revenue + My Earnings This Month (same logic)
  const earningsThisMonth = await knex('deliveries').join('orders', 'deliveries.order_id', 'orders.id').where('deliveries.vendor_id', vendor_id).andWhere('deliveries.status', 'delivered').andWhere('deliveries.delivered_at', '>=', startOfMonth).sum('orders.total_price as total').first()

  res.json({
    products: {
      total: parseInt(totalProducts.count),
      published: parseInt(publishedProducts.count),
      unpublished: parseInt(unpublishedProducts.count),
      best_selling_count: bestSellingProducts.length
    },
    orders: {
      total: parseInt(totalOrders.count),
      new: parseInt(newOrders.count),
      in_transit: parseInt(inTransitOrders.count),
      delivered_this_month: parseInt(deliveredThisMonth.count)
    },
    revenue: {
      total: parseInt(earningsThisMonth.total) || 0,
      earnings_this_month: parseInt(earningsThisMonth.total) || 0
    }
  })
}

module.exports = { getVendorDashboardOverview }
