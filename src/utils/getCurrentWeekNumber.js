// Helper function to get current week number
function getCurrentWeekNumber() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + 1) / 7)
}

module.exports = { getCurrentWeekNumber }
