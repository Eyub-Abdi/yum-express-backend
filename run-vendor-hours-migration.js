// run-vendor-hours-migration.js
const knex = require('./src/db/knex') // Adjust path to your knex config

async function runSingleMigration() {
  try {
    await knex.migrate.up('20250716_create_vendors_table')
    console.log('✅ Migration ran successfully.')
  } catch (error) {
    console.error('❌ Error running migration:', error)
  } finally {
    await knex.destroy()
  }
}

runSingleMigration()
