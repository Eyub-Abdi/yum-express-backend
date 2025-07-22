const { envBoolean } = require('../src/utils/evnBoolean')

module.exports = {
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key', // Default secret if no env var is set
    expiresIn: process.env.JWT_EXPIRES_IN || '1h' // Default expiration time if no env var is set
  },
  session: {
    secret: process.env.SESSION_SECRET // Session token secret from environment variables
  },
  email: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE, // ENCRYPTION BOOLEAN VALUES
    user: process.env.MAIL_USER, // Email address
    pass: process.env.MAIL_PASS
  },
  payment: {
    clientId: process.env.PAYMENT_CLIENT_ID,
    apiKey: process.env.PAYMENT_API_KEY
  },
  sms: {
    username: process.env.NEXT_SMS_USERNAME, // Next SMS username
    password: process.env.NEXT_SMS_PASSWORD, // Next SMS password
    isTestMode: process.env.IS_TEST_MODE,
    senderId: process.env.SENDER_ID
  }
}
