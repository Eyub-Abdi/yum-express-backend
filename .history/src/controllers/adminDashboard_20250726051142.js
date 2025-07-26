// const knex = require('../db/knex')

// const getAdminDashboard = async (req, res) => {
//   try {
//     const [totalOrders, deliveredOrders, processingOrders, cancelledOrders, ordersThisWeek, vendorsCount, newVendorsThisMonth, revenueThisMonth, avgOrderValueThisMonth, dailyOrders, topVendors, totalDrivers, activeDrivers, onDeliveryDrivers] = await Promise.all([knex('orders').count('id as total_orders').first(), knex('orders').where({ order_status: 'delivered' }).count('id as delivered_orders').first(), knex('orders').where({ order_status: 'processing' }).count('id as processing_orders').first(), knex('orders').where({ order_status: 'cancelled' }).count('id as cancelled_orders').first(), knex('orders').whereRaw("created_at >= date_trunc('week', now())").count('id as orders_this_week').first(), knex('vendors').count('id as vendors_count').first(), knex('vendors').whereRaw("date_trunc('month', created_at) = date_trunc('month', now())").count('id as new_vendors_this_month').first(), knex('orders').sum('total_price as revenue_this_month').whereRaw("date_trunc('month', created_at) = date_trunc('month', now())").first(), knex('orders').avg('total_price as avg_order_value_this_month').whereRaw("date_trunc('month', created_at) = date_trunc('month', now())").first(), knex('orders').select(knex.raw("to_char(created_at, 'YYYY-MM-DD') as date")).count('id as order_count').whereRaw("created_at >= now() - interval '7 days'").groupByRaw("to_char(created_at, 'YYYY-MM-DD')").orderBy('date'), knex('vendors as v').select('v.id', 'v.first_name', 'v.last_name').sum('o.total_price as vendor_revenue').leftJoin('orders as o', 'v.id', 'o.vendor_id').groupBy('v.id', 'v.first_name', 'v.last_name').orderBy('vendor_revenue', 'desc').limit(5), knex('drivers').count('id as total_drivers').first(), knex('drivers').where({ status: 'active' }).count('id as active_drivers').first(), knex('drivers').where({ status: 'on_delivery' }).count('id as on_delivery_drivers').first()])

//     res.json({
//       total_orders: Number(totalOrders.total_orders),
//       delivered_orders: Number(deliveredOrders.delivered_orders),
//       processing_orders: Number(processingOrders.processing_orders),
//       cancelled_orders: Number(cancelledOrders.cancelled_orders),
//       orders_this_week: Number(ordersThisWeek.orders_this_week),
//       vendors_count: Number(vendorsCount.vendors_count),
//       new_vendors_this_month: Number(newVendorsThisMonth.new_vendors_this_month),
//       revenue_this_month: Number(revenueThisMonth.revenue_this_month || 0),
//       avg_order_value_this_month: Number(avgOrderValueThisMonth.avg_order_value_this_month || 0),
//       daily_orders_last_7_days: dailyOrders.map(day => ({
//         date: day.date,
//         count: Number(day.order_count)
//       })),
//       top_vendors_by_revenue: topVendors.map(v => ({
//         id: v.id,
//         name: `${v.first_name} ${v.last_name}`,
//         revenue: Number(v.vendor_revenue)
//       })),
//       drivers: {
//         total: Number(totalDrivers.total_drivers),
//         active: Number(activeDrivers.active_drivers),
//         on_delivery: Number(onDeliveryDrivers.on_delivery_drivers)
//       }
//     })
//   } catch (error) {
//     console.error('Dashboard error:', error)
//     res.status(500).json({ error: 'Server error fetching dashboard data' })
//   }
// }

// module.exports = { getAdminDashboard }

// const knex = require('../db/knex')

// const getAdminDashboard = async (req, res) => {
//   try {
//     const thisMonth = "date_trunc('month', created_at) = date_trunc('month', now())"
//     const thisWeek = "created_at >= date_trunc('week', now())"
//     const last7Days = "created_at >= now() - interval '7 days'"

//     const [totalOrders, deliveredOrders, processingOrders, cancelledOrders, vendorsCount, newVendorsThisMonth, revenueThisMonth, avgOrderValueThisMonth, ordersThisWeek, dailyOrders, topVendors, totalDrivers, activeDrivers, onDeliveryDrivers, totalCustomers] = await Promise.all([knex('orders').count('id as total_orders').first(), knex('orders').where({ order_status: 'delivered' }).count('id as delivered_orders').first(), knex('orders').where({ order_status: 'processing' }).count('id as processing_orders').first(), knex('orders').where({ order_status: 'cancelled' }).count('id as cancelled_orders').first(), knex('vendors').count('id as vendors_count').first(), knex('vendors').whereRaw(thisMonth).count('id as new_vendors_this_month').first(), knex('orders').sum('total_price as revenue_this_month').whereRaw(thisMonth).first(), knex('orders').avg('total_price as avg_order_value_this_month').whereRaw(thisMonth).first(), knex('orders').whereRaw(thisWeek).count('id as orders_this_week').first(), knex('orders').select(knex.raw("to_char(created_at, 'YYYY-MM-DD') as date")).count('id as order_count').whereRaw(last7Days).groupByRaw("to_char(created_at, 'YYYY-MM-DD')").orderBy('date'), knex('vendors as v').select('v.id', 'v.first_name', 'v.last_name').sum('o.total_price as vendor_revenue').leftJoin('orders as o', 'v.id', 'o.vendor_id').groupBy('v.id', 'v.first_name', 'v.last_name').orderBy('vendor_revenue', 'desc').limit(5), knex('drivers').count('id as total_drivers').first(), knex('drivers').where({ status: 'active' }).count('id as active_drivers').first(), knex('drivers').where({ status: 'on_delivery' }).count('id as on_delivery_drivers').first(), knex('customers').count('id as total_customers').first()])

//     res.json({
//       total_orders: +totalOrders.total_orders,
//       delivered_orders: +deliveredOrders.delivered_orders,
//       processing_orders: +processingOrders.processing_orders,
//       cancelled_orders: +cancelledOrders.cancelled_orders,
//       orders_this_week: +ordersThisWeek.orders_this_week,
//       vendors_count: +vendorsCount.vendors_count,
//       new_vendors_this_month: +newVendorsThisMonth.new_vendors_this_month,
//       revenue_this_month: +(revenueThisMonth.revenue_this_month || 0),
//       avg_order_value_this_month: +(avgOrderValueThisMonth.avg_order_value_this_month || 0),
//       total_customers: +totalCustomers.total_customers, // ⬅️ Included in response
//       daily_orders_last_7_days: dailyOrders.map(day => ({
//         date: day.date,
//         count: +day.order_count
//       })),
//       top_vendors_by_revenue: topVendors.map(v => ({
//         id: v.id,
//         name: `${v.first_name} ${v.last_name}`,
//         revenue: +v.vendor_revenue
//       })),
//       drivers: {
//         total: +totalDrivers.total_drivers,
//         active: +activeDrivers.active_drivers,
//         on_delivery: +onDeliveryDrivers.on_delivery_drivers
//       }
//     })
//   } catch (error) {
//     console.error('Dashboard error:', error)
//     res.status(500).json({ error: 'Server error fetching dashboard data' })
//   }
// }

// module.exports = { getAdminDashboard }

const getAdminDashboard = async (req, res) => {
  try {
    const thisMonth = "date_trunc('month', created_at) = date_trunc('month', now())"
    const thisWeek = "created_at >= date_trunc('week', now())"
    const last7Days = "created_at >= now() - interval '7 days'"

    const [
      totalOrders,
      deliveredOrders,
      processingOrders,
      cancelledOrders,
      vendorsCount,
      newVendorsThisMonth,
      revenueThisMonth,
      avgOrderValueThisMonth,
      ordersThisWeek,
      dailyOrders,
      topVendors,
      totalDrivers,
      activeDrivers,
      onDeliveryDrivers,
      totalCustomers,

      // 🆕 Delivery-related queries
      totalDeliveries,
      completedDeliveries,
      pendingDeliveries,
      cancelledDeliveries
    ] = await Promise.all([
      knex('orders').count('id as total_orders').first(),
      knex('orders').where({ order_status: 'delivered' }).count('id as delivered_orders').first(),
      knex('orders').where({ order_status: 'processing' }).count('id as processing_orders').first(),
      knex('orders').where({ order_status: 'cancelled' }).count('id as cancelled_orders').first(),
      knex('vendors').count('id as vendors_count').first(),
      knex('vendors').whereRaw(thisMonth).count('id as new_vendors_this_month').first(),
      knex('orders').sum('total_price as revenue_this_month').whereRaw(thisMonth).first(),
      knex('orders').avg('total_price as avg_order_value_this_month').whereRaw(thisMonth).first(),
      knex('orders').whereRaw(thisWeek).count('id as orders_this_week').first(),
      knex('orders').select(knex.raw("to_char(created_at, 'YYYY-MM-DD') as date")).count('id as order_count').whereRaw(last7Days).groupByRaw("to_char(created_at, 'YYYY-MM-DD')").orderBy('date'),
      knex('vendors as v').select('v.id', 'v.first_name', 'v.last_name').sum('o.total_price as vendor_revenue').leftJoin('orders as o', 'v.id', 'o.vendor_id').groupBy('v.id', 'v.first_name', 'v.last_name').orderBy('vendor_revenue', 'desc').limit(5),
      knex('drivers').count('id as total_drivers').first(),
      knex('drivers').where({ status: 'active' }).count('id as active_drivers').first(),
      knex('drivers').where({ status: 'on_delivery' }).count('id as on_delivery_drivers').first(),
      knex('customers').count('id as total_customers').first(),

      // 🆕 Delivery stats
      knex('deliveries').count('id as total_deliveries').first(),
      knex('deliveries').where({ status: 'completed' }).count('id as completed_deliveries').first(),
      knex('deliveries').where({ status: 'pending' }).count('id as pending_deliveries').first(),
      knex('deliveries').where({ status: 'cancelled' }).count('id as cancelled_deliveries').first()
    ])

    res.json({
      total_orders: +totalOrders.total_orders,
      delivered_orders: +deliveredOrders.delivered_orders,
      processing_orders: +processingOrders.processing_orders,
      cancelled_orders: +cancelledOrders.cancelled_orders,
      orders_this_week: +ordersThisWeek.orders_this_week,
      vendors_count: +vendorsCount.vendors_count,
      new_vendors_this_month: +newVendorsThisMonth.new_vendors_this_month,
      revenue_this_month: +(revenueThisMonth.revenue_this_month || 0),
      avg_order_value_this_month: +(avgOrderValueThisMonth.avg_order_value_this_month || 0),
      total_customers: +totalCustomers.total_customers,
      daily_orders_last_7_days: dailyOrders.map(day => ({
        date: day.date,
        count: +day.order_count
      })),
      top_vendors_by_revenue: topVendors.map(v => ({
        id: v.id,
        name: `${v.first_name} ${v.last_name}`,
        revenue: +v.vendor_revenue
      })),
      drivers: {
        total: +totalDrivers.total_drivers,
        active: +activeDrivers.active_drivers,
        on_delivery: +onDeliveryDrivers.on_delivery_drivers
      },
      // 🆕 Deliveries section
      deliveries: {
        total: +totalDeliveries.total_deliveries,
        completed: +completedDeliveries.completed_deliveries,
        pending: +pendingDeliveries.pending_deliveries,
        cancelled: +cancelledDeliveries.cancelled_deliveries
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Server error fetching dashboard data' })
  }
}
module.exports = { getAdminDashboard }
