// const dayjs = require('dayjs')
// const knex = require('../db/knex')

// const getVendorOpenStatus = async vendor_id => {
//   const rows = await knex('vendor_hours').where({ vendor_id }).select('category', 'open_time', 'close_time', 'is_closed')

//   const result = {}
//   for (const row of rows) {
//     // Format time to remove seconds (HH:mm only)
//     const open = row.open_time ? dayjs(`2000-01-01T${row.open_time}`).format('HH:mm') : null
//     const close = row.close_time ? dayjs(`2000-01-01T${row.close_time}`).format('HH:mm') : null

//     result[row.category] = {
//       open_time: open,
//       close_time: close,
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
    let open = dayjs(`${todayStr}T${todayHours.open_time}`)
    let close = dayjs(`${todayStr}T${todayHours.close_time}`)

    // Handle overnight closing (close time before open time means closing next day)
    if (close.isBefore(open)) {
      close = close.add(1, 'day')
    }

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
