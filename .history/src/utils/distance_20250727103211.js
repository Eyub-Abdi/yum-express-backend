// utils/distance.js
const geolib = require('geolib')

function calculateDeliveryFee(fromLat, fromLng, toLat, toLng, ratePerKm = 600) {
  const distanceInMeters = geolib.getDistance({ latitude: fromLat, longitude: fromLng }, { latitude: toLat, longitude: toLng })

  const distanceInKm = distanceInMeters / 1000
  const fee = Math.ceil(distanceInKm * ratePerKm)

  return { fee, distanceInKm }
}

module.exports = { calculateDeliveryFee }
