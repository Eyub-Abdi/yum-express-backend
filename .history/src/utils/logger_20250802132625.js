// const { createLogger, format, transports } = require('winston')
// const { combine, timestamp, printf, colorize, errors } = format

// // Custom format for logs
// const logFormat = printf(({ level, message, timestamp, stack }) => {
//   return `${timestamp} ${level}: ${stack || message}`
// })

// const logger = createLogger({
//   level: 'info',
//   format: combine(
//     colorize(),
//     timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     errors({ stack: true }), // logs stack trace for errors
//     logFormat
//   ),
//   transports: [new transports.Console(), new transports.File({ filename: 'logs/error.log', level: 'error' }), new transports.File({ filename: 'logs/combined.log' })]
// })

// module.exports = logger

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf, colorize, errors } = format

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`
})

const logger = createLogger({
  level: 'info', // sets the minimum level to log
  format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/info.log', level: 'info' }) // <-- changed here
  ]
})

module.exports = logger
