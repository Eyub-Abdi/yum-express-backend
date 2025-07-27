// controllers/deliveryController.js
const { calculateDeliveryFee } = require('../utils/distance')
const knex = require('../db/knex')

// const estimateDeliveryFee = async (req, res) => {
//   const { fromLat, fromLng, vendor_id } = req.body

//   if (!fromLat || !fromLng || !vendor_id) {
//     return res.status(400).json({ error: 'Missing required fields' })
//   }

//   try {
//     const vendor = await knex('vendors').where({ id: vendor_id }).first()

//     if (!vendor || !vendor.lat || !vendor.lng) {
//       return res.status(404).json({ error: 'Vendor not found or missing location data' })
//     }

//     const { fee, distanceInKm } = calculateDeliveryFee(fromLat, fromLng, vendor.lat, vendor.lng)

//     res.json({
//       distance: `${distanceInKm.toFixed(2)} km`,
//       fee: `${fee} Tsh`
//     })
//   } catch (error) {
//     console.error('Error calculating fee:', error)
//     res.status(500).json({ error: 'Server error' })
//   }
// }

// module.exports = { estimateDeliveryFee }

const estimateDeliveryFee = async (req, res) => {
  const { fromLat, fromLng, vendor_id } = req.body

  if (!fromLat || !fromLng || !vendor_id) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const vendor = await knex('vendors').where({ id: vendor_id }).first()

    if (!vendor || !vendor.lat || !vendor.lng) {
      return res.status(404).json({ error: 'Vendor not found or missing location data' })
    }

    const { fee, distanceInKm } = calculateDeliveryFee(Number(fromLat), Number(fromLng), Number(vendor.lat), Number(vendor.lng))

    res.json({
      distance: `${distanceInKm.toFixed(2)} km`,
      fee
    })
  } catch (error) {
    console.error('Error calculating fee:', error)
    res.status(500).json({ error: 'Server error' })
  }
}
module.exports = { estimateDeliveryFee }
