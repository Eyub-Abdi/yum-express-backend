const validateId = id => {
  return Number.isInteger(Number(id)) && Number(id) > 0
}

module.exports = { validateId }
