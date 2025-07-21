/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('carts', table => {
    table.increments('id').primary()

    table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('SET NULL')

    table.string('session_token', 255).unique()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('expires_at').notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP + interval '7 days'"))
    table.string('signature', 255)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('carts')
}
