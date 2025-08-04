const log = require('../utils/logger')
module.exports = function (err, req, res, next) {
  log.error(err)
  res.status(500).send('Something went wrong.')
}
