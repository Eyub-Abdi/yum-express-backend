// knexfile.js (placed in the root of your project)

const knexConfig = require('./config/default')

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: knexConfig.db.host,
      user: knexConfig.db.user,
      password: knexConfig.db.password,
      database: knexConfig.db.database
    },
    migrations: {
      directory: './migrations' // folder where migration files live
    }
    // seeds: {
    //   directory: './seeds'     // optional if you use seed files
    // }
  }

  // Add production/test configs as needed
}
