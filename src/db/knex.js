// config/knex.js
const knexConfig = require('../../config/default') // Importing the config that holds DB credentials
const knex = require('knex')

// Creating and exporting the Knex instance
const db = knex({
  client: 'pg', // PostgreSQL client
  connection: {
    host: knexConfig.db.host,
    user: knexConfig.db.user,
    password: knexConfig.db.password,
    database: knexConfig.db.database
  }
})

module.exports = db
