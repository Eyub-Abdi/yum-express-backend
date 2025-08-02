const log = require('../utils/logger')
module.exports = function (err, req, res, next) {
  log.error(err)
  // Log the console.error(res);
  console.log('Logging the error')
  res.status(500).send('Something went wrong.')
}
