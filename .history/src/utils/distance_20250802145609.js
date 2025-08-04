const geolib = require('geolib')

function calculateDeliveryFee(fromLat, fromLng, toLat, toLng) {
  const distanceInMeters = geolib.getDistance({ latitude: fromLat, longitude: fromLng }, { latitude: toLat, longitude: toLng })

  const distanceInKm = distanceInMeters / 1000

  let fee = 0
  if (distanceInKm < 3) {
    fee = 2000
  } else {
    fee = Math.ceil(distanceInKm) * 700
  }

  return { fee, distanceInKm }
}

module.exports = { calculateDeliveryFee }
