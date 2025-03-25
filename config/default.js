module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost', // Default to 'localhost' if no env var is set
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key', // Default secret if no env var is set
    expiresIn: process.env.JWT_EXPIRES_IN || '1h' // Default expiration time if no env var is set
  },
  email: {
    user: process.env.BREVO_EMAIL_USER // Email address
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY
  }
}
