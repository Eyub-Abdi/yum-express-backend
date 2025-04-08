const knex = require('../db/knex')
const { getCurrentWeekNumber } = require('../utils/getCurrentWeekNumber')

const getVendorWeeklySales = async (req, res) => {
  // Get current week number
  const currentWeek = getCurrentWeekNumber()

  const vendorId = req.user.id // Authenticated vendor ID

  // Fetch the total sales for the current week for this vendor
  const sales = await knex('vendor_orders').where('vendor_orders.vendor_id', vendorId).andWhere('vendor_orders.payment_week', currentWeek).sum('vendor_orders.vendor_price as total_sales').first()

  // Check if any sales data exists
  if (!sales || !sales.total_sales) {
    return res.status(200).json({ message: 'No sales for this week' })
  }

  res.status(200).json({
    message: 'Weekly sales data fetched successfully',
    total_sales: sales.total_sales,
    week: currentWeek
  })
}

const getMonthlyVendorSales = async (req, res) => {
  if (req.user?.type !== 'vendor') {
    return res.status(403).json({ error: 'Access denied: Vendors only' })
  }

  const vendorId = req.user.id
  const year = parseInt(req.query.year) || new Date().getFullYear()

  const sales = await knex('vendor_orders').where('vendor_id', vendorId).andWhereRaw('EXTRACT(YEAR FROM created_at) = ?', [year]).select(knex.raw("TO_CHAR(created_at, 'Month') as month"), knex.raw('EXTRACT(MONTH FROM created_at) as month_number'), knex.raw('SUM(vendor_price)::numeric::float8 as total_sales')).groupByRaw('month, month_number').orderBy('month_number')

  res.status(200).json({ year, sales })
}

module.exports = { getVendorWeeklySales, getMonthlyVendorSales }
