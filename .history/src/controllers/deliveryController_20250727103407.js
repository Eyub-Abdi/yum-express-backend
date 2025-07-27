// controllers/deliveryController.js
const { calculateDeliveryFee } = require('../utils/distance')

const estimateDeliveryFee = (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.body

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({ error: 'Missing coordinates' })
  }

  const { fee, distanceInKm } = calculateDeliveryFee(fromLat, fromLng, toLat, toLng)

  res.json({
    distance: `${distanceInKm.toFixed(2)} km`,
    fee: `${fee} TSh`
  })
}

module.exports = { estimateDeliveryFee }
