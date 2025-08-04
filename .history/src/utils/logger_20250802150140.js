const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf, colorize, errors } = format

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`
})

const logger = createLogger({
  level: 'info',
  format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  transports: [new transports.Console(), new transports.File({ filename: 'logs/error.log', level: 'error' }), new transports.File({ filename: 'logs/info.log', level: 'info' })],
  exceptionHandlers: [new transports.File({ filename: 'logs/exceptions.log' })],
  rejectionHandlers: [new transports.File({ filename: 'logs/rejections.log' })]
})

module.exports = logger
