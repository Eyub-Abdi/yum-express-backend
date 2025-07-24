/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('customers', table => {
    table.increments('id').primary()
    table.string('first_name', 255).notNullable()
    table.string('last_name', 255).notNullable()
    table.string('email', 255).notNullable().unique()
    table.string('phone', 20).notNullable().unique()
    table.text('password_hash').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.string('verification_token', 255)
    table.boolean('verified').defaultTo(false)
    table.timestamp('verification_token_expiry')

    table.string('otp_code', 10)
    table.timestamp('otp_expiry')

    // Indexes to match Postgres output
    table.index('email', 'idx_customers_email')
    table.index('phone', 'idx_customers_phone')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('customers')
}
