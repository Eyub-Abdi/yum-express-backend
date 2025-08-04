/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('admins', table => {
    table.increments('id').primary()
    table.string('first_name', 100)
    table.string('last_name', 100)
    table.string('phone', 20)
    table.string('email', 255).notNullable().unique()
    table.string('role', 50).defaultTo('admin')
    table.boolean('is_active').defaultTo(true)
    table.boolean('verified').defaultTo(false)
    table.timestamp('last_login')
    table.text('password_hash').notNullable()
    table.text('verification_token')
    table.timestamp('verification_token_expiry')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('admins')
}
