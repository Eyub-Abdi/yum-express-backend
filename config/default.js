module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost', // Default to 'localhost' if no env var is set
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
}
