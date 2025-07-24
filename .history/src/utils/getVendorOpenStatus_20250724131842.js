// // helpers/getVendorOpenStatus.js
// const dayjs = require('dayjs')
// const knex = require('../db/knex')

// const getVendorOpenStatus = async vendor_id => {
//   const rows = await knex('vendor_hours').where({ vendor_id }).select('category', 'open_time', 'close_time', 'is_closed')

//   const result = {}
//   for (const row of rows) {
//     result[row.category] = {
//       open_time: row.open_time,
//       close_time: row.close_time,
//       is_closed: row.is_closed
//     }
//   }

//   const day = dayjs().day()
//   const todayCategory = day === 0 ? 'sunday' : day === 6 ? 'saturday' : 'weekdays'
//   const todayHours = result[todayCategory]

//   let is_open = false

//   if (todayHours && !todayHours.is_closed && todayHours.open_time && todayHours.close_time) {
//     const now = dayjs()
//     const currentMinutes = now.hour() * 60 + now.minute()

//     const [openHour, openMinute] = todayHours.open_time.split(':').map(Number)
//     const [closeHour, closeMinute] = todayHours.close_time.split(':').map(Number)

//     const openMinutes = openHour * 60 + openMinute
//     const closeMinutes = closeHour * 60 + closeMinute

//     is_open = currentMinutes >= openMinutes && currentMinutes < closeMinutes

//     // Auto-update DB if status is incorrect
//     if (!is_open && !todayHours.is_closed) {
//       await knex('vendor_hours').where({ vendor_id, category: todayCategory }).update({ is_closed: true, updated_at: knex.fn.now() })
//     } else if (is_open && todayHours.is_closed) {
//       await knex('vendor_hours').where({ vendor_id, category: todayCategory }).update({ is_closed: false, updated_at: knex.fn.now() })
//     }
//   }

//   return {
//     is_open,
//     current_day: todayCategory,
//     hours: result
//   }
// }

// module.exports = getVendorOpenStatus

// const dayjs = require('dayjs')
// const knex = require('../db/knex')

// const getVendorOpenStatus = async vendor_id => {
//   const rows = await knex('vendor_hours').where({ vendor_id }).select('category', 'open_time', 'close_time', 'is_closed')

//   const result = {}
//   for (const row of rows) {
//     result[row.category] = {
//       open_time: row.open_time,
//       close_time: row.close_time,
//       is_closed: row.is_closed
//     }
//   }

//   const now = dayjs()
//   const day = now.day() // 0 = Sunday, 6 = Saturday
//   const todayCategory = day === 0 ? 'sunday' : day === 6 ? 'saturday' : 'weekdays'
//   const todayHours = result[todayCategory]

//   let is_open = false
//   let message = 'Closed today'

//   if (todayHours && !todayHours.is_closed && todayHours.open_time && todayHours.close_time) {
//     const todayStr = now.format('YYYY-MM-DD')
//     const open = dayjs(`${todayStr}T${todayHours.open_time}`)
//     const close = dayjs(`${todayStr}T${todayHours.close_time}`)

//     is_open = now.isAfter(open) && now.isBefore(close)

//     if (is_open) {
//       message = `Open now - Closes at ${close.format('h:mm A')}`
//     } else {
//       message = `Closed - Opens at ${open.format('h:mm A')}`
//     }
//   }

//   return {
//     is_open,
//     message,
//     current_day: todayCategory,
//     hours: result
//   }
// }

// module.exports = getVendorOpenStatus

const dayjs = require('dayjs')
const knex = require('../db/knex')

const getVendorOpenStatus = async vendor_id => {
  const rows = await knex('vendor_hours').where({ vendor_id }).select('category', 'open_time', 'close_time', 'is_closed')

  const result = {}
  for (const row of rows) {
    // Format time to remove seconds (HH:mm only)
    const open = row.open_time ? dayjs(`2000-01-01T${row.open_time}`).format('HH:mm') : null
    const close = row.close_time ? dayjs(`2000-01-01T${row.close_time}`).format('HH:mm') : null

    result[row.category] = {
      open_time: open,
      close_time: close,
      is_closed: row.is_closed
    }
  }

  const now = dayjs()
  const day = now.day() // 0 = Sunday, 6 = Saturday
  const todayCategory = day === 0 ? 'sunday' : day === 6 ? 'saturday' : 'weekdays'
  const todayHours = result[todayCategory]

  let is_open = false
  let message = 'Closed today'

  if (todayHours && !todayHours.is_closed && todayHours.open_time && todayHours.close_time) {
    const todayStr = now.format('YYYY-MM-DD')
    const open = dayjs(`${todayStr}T${todayHours.open_time}`)
    const close = dayjs(`${todayStr}T${todayHours.close_time}`)

    is_open = now.isAfter(open) && now.isBefore(close)

    if (is_open) {
      message = `Open now - Closes at ${close.format('h:mm A')}`
    } else {
      message = `Closed - Opens at ${open.format('h:mm A')}`
    }
  }

  return {
    is_open,
    message,
    current_day: todayCategory,
    hours: result
  }
}

module.exports = getVendorOpenStatus
