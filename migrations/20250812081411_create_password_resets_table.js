/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('password_resets', table => {
    table.increments('id').primary()
    table.integer('user_id').notNullable()
    table.string('user_type', 20).notNullable()
    table.string('token', 64).notNullable()
    table.timestamp('expires_at').notNullable()
    table.boolean('used').defaultTo(false)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('used_at').nullable()

    table.index(['user_id', 'user_type'], 'idx_password_resets_user')
    table.index('token', 'idx_password_resets_token')
  })
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('password_resets')
}
