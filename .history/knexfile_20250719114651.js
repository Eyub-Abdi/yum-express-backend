// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const config = require('./config/default.js')

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      database: config.db.database,
      user: config.db.user,
      password: config.db.password
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
}
