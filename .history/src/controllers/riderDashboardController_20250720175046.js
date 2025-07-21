const knex = require('../db/knex')

const getRiderDashboard = async (req, res) => {
  try {
    const riderId = req.params.riderId || req.user?.id // Get rider ID from params or auth

    const [totalDeliveries, completedDeliveries, pendingDeliveries, inProgressDeliveries, deliveriesToday, deliveriesThisWeek, deliveriesThisMonth, avgDeliveryTime, dailyDeliveries, recentDeliveries, riderStats, upcomingDeliveries] = await Promise.all([
      // Total deliveries assigned to this rider
      knex('deliveries').where({ assigned_to: riderId }).count('id as total_deliveries').first(),

      // Completed deliveries
      knex('deliveries').where({ assigned_to: riderId, status: 'delivered' }).count('id as completed_deliveries').first(),

      // Pending deliveries
      knex('deliveries').where({ assigned_to: riderId, status: 'pending' }).count('id as pending_deliveries').first(),

      // In progress deliveries
      knex('deliveries').where({ assigned_to: riderId, status: 'in_progress' }).count('id as in_progress_deliveries').first(),

      // Deliveries today
      knex('deliveries').where({ assigned_to: riderId }).whereRaw("date_trunc('day', created_at) = date_trunc('day', now())").count('id as deliveries_today').first(),

      // Deliveries this week
      knex('deliveries').where({ assigned_to: riderId }).whereRaw("created_at >= date_trunc('week', now())").count('id as deliveries_this_week').first(),

      // Deliveries this month
      knex('deliveries').where({ assigned_to: riderId }).whereRaw("date_trunc('month', created_at) = date_trunc('month', now())").count('id as deliveries_this_month').first(),

      // Average delivery time (in minutes)
      knex('deliveries').where({ assigned_to: riderId, status: 'delivered' }).whereNotNull('delivered_at').select(knex.raw('AVG(EXTRACT(EPOCH FROM (delivered_at - created_at))/60) as avg_delivery_time')).first(),

      // Daily deliveries for the last 7 days
      knex('deliveries').where({ assigned_to: riderId }).select(knex.raw("to_char(created_at, 'YYYY-MM-DD') as date")).count('id as delivery_count').whereRaw("created_at >= now() - interval '7 days'").groupByRaw("to_char(created_at, 'YYYY-MM-DD')").orderBy('date'),

      // Recent deliveries with order details
      knex('deliveries as d').select('d.id', 'd.order_id', 'd.status', 'd.address', 'd.phone', 'd.created_at', 'd.delivered_at', 'o.total_price', knex.raw("CONCAT(c.first_name, ' ', c.last_name) as customer_name"), knex.raw("CONCAT(v.first_name, ' ', v.last_name) as vendor_name")).leftJoin('orders as o', 'd.order_id', 'o.id').leftJoin('customers as c', 'd.customer_id', 'c.id').leftJoin('vendors as v', 'd.vendor_id', 'v.id').where({ 'd.assigned_to': riderId }).orderBy('d.created_at', 'desc').limit(10),

      // Rider performance stats
      knex('deliveries').where({ assigned_to: riderId }).select(knex.raw('COUNT(*) as total_assigned'), knex.raw("COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed"), knex.raw("COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled"), knex.raw("ROUND(COUNT(CASE WHEN status = 'delivered' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate")).first(),

      // Upcoming deliveries (pending and in progress)
      knex('deliveries as d').select('d.id', 'd.order_id', 'd.status', 'd.address', 'd.phone', 'd.estimated_time', 'd.delivery_notes', 'o.total_price', knex.raw("CONCAT(c.first_name, ' ', c.last_name) as customer_name"), knex.raw("CONCAT(v.first_name, ' ', v.last_name) as vendor_name")).leftJoin('orders as o', 'd.order_id', 'o.id').leftJoin('customers as c', 'd.customer_id', 'c.id').leftJoin('vendors as v', 'd.vendor_id', 'v.id').where({ 'd.assigned_to': riderId }).whereIn('d.status', ['pending', 'in_progress']).orderBy('d.estimated_time', 'asc').limit(5)
    ])

    res.json({
      rider_id: riderId,
      summary: {
        total_deliveries: Number(totalDeliveries.total_deliveries),
        completed_deliveries: Number(completedDeliveries.completed_deliveries),
        pending_deliveries: Number(pendingDeliveries.pending_deliveries),
        in_progress_deliveries: Number(inProgressDeliveries.in_progress_deliveries),
        deliveries_today: Number(deliveriesToday.deliveries_today),
        deliveries_this_week: Number(deliveriesThisWeek.deliveries_this_week),
        deliveries_this_month: Number(deliveriesThisMonth.deliveries_this_month),
        avg_delivery_time_minutes: Number(avgDeliveryTime.avg_delivery_time || 0).toFixed(1)
      },
      performance: {
        total_assigned: Number(riderStats.total_assigned),
        completed: Number(riderStats.completed),
        cancelled: Number(riderStats.cancelled),
        completion_rate: Number(riderStats.completion_rate || 0)
      },
      daily_deliveries_last_7_days: dailyDeliveries.map(day => ({
        date: day.date,
        count: Number(day.delivery_count)
      })),
      recent_deliveries: recentDeliveries.map(delivery => ({
        id: delivery.id,
        order_id: delivery.order_id,
        status: delivery.status,
        customer_name: delivery.customer_name,
        vendor_name: delivery.vendor_name,
        address: delivery.address,
        phone: delivery.phone,
        total_price: Number(delivery.total_price || 0),
        created_at: delivery.created_at,
        delivered_at: delivery.delivered_at
      })),
      upcoming_deliveries: upcomingDeliveries.map(delivery => ({
        id: delivery.id,
        order_id: delivery.order_id,
        status: delivery.status,
        customer_name: delivery.customer_name,
        vendor_name: delivery.vendor_name,
        address: delivery.address,
        phone: delivery.phone,
        estimated_time: delivery.estimated_time,
        delivery_notes: delivery.delivery_notes,
        total_price: Number(delivery.total_price || 0)
      }))
    })
  } catch (error) {
    console.error('Rider Dashboard error:', error)
    res.status(500).json({ error: 'Server error fetching rider dashboard data' })
  }
}

// Get all riders dashboard (for admin view)
const getAllRidersDashboard = async (req, res) => {
  try {
    const [totalRiders, activeRiders, ridersOnDelivery, topPerformingRiders, riderDeliveryStats] = await Promise.all([
      // Total riders
      knex('drivers').count('id as total_riders').first(),

      // Active riders
      knex('drivers').where({ status: 'active' }).count('id as active_riders').first(),

      // Riders on delivery
      knex('drivers').where({ status: 'on_delivery' }).count('id as riders_on_delivery').first(),

      // Top performing riders by completed deliveries this month
      knex('drivers as dr')
        .select('dr.id', knex.raw("CONCAT(dr.first_name, ' ', dr.last_name) as rider_name"), 'dr.phone', 'dr.status')
        .count('d.id as completed_deliveries')
        .leftJoin('deliveries as d', function () {
          this.on('dr.id', '=', 'd.assigned_to').andOn('d.status', '=', knex.raw("'delivered'")).andOn(knex.raw("date_trunc('month', d.created_at)"), '=', knex.raw("date_trunc('month', now())"))
        })
        .groupBy('dr.id', 'dr.first_name', 'dr.last_name', 'dr.phone', 'dr.status')
        .orderBy('completed_deliveries', 'desc')
        .limit(10),

      // Delivery stats by status
      knex('deliveries').select('status').count('id as count').groupBy('status')
    ])

    res.json({
      summary: {
        total_riders: Number(totalRiders.total_riders),
        active_riders: Number(activeRiders.active_riders),
        riders_on_delivery: Number(ridersOnDelivery.riders_on_delivery)
      },
      top_performing_riders: topPerformingRiders.map(rider => ({
        id: rider.id,
        name: rider.rider_name,
        phone: rider.phone,
        status: rider.status,
        completed_deliveries: Number(rider.completed_deliveries)
      })),
      delivery_stats_by_status: riderDeliveryStats.map(stat => ({
        status: stat.status,
        count: Number(stat.count)
      }))
    })
  } catch (error) {
    console.error('All Riders Dashboard error:', error)
    res.status(500).json({ error: 'Server error fetching riders dashboard data' })
  }
}

module.exports = {
  getRiderDashboard,
  getAllRidersDashboard
}
