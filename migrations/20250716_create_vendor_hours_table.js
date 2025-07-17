/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('vendor_hours', table => {
    table.increments('id').primary()

    table.integer('vendor_id').unsigned().notNullable().references('id').inTable('vendors').onDelete('CASCADE')

    table.string('day', 10).notNullable()
    table.time('open_time').nullable()
    table.time('close_time').nullable()
    table.boolean('is_closed').notNullable().defaultTo(false)

    table.timestamp('created_at').defaultTo(knex.fn.now())

    table.unique(['vendor_id', 'day'])

    // Optional: enforce correct day values (Postgres specific)
    table.check(`day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('vendor_hours')
}
