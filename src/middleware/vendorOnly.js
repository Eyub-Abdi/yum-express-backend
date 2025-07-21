const vendorOnly = (req, res, next) => {
  if (!req.user || req.user.type !== 'vendor') {
    return res.status(403).json({ message: 'Access denied. Vendor access only.' })
  }

  next()
}

module.exports = vendorOnly
