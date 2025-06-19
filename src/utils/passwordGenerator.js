function generateDefaultPassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let randomPart = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    randomPart += chars[randomIndex]
  }
  return `Welcome@${randomPart}`
}

module.exports = generateDefaultPassword
