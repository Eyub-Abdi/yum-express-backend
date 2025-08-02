module.exports = function (err, req, res, next) {
  // Log the console.error(res);
  console.log('Logging the error')
  res.status(500).send('Something went wrong.')
}
