/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('vendor_hours', table => {
    table.increments('id').primary()

    table.integer('vendor_id').unsigned().notNullable().references('id').inTable('vendors').onDelete('CASCADE')

    table.string('category', 10).notNullable() // 'weekdays', 'saturday', 'sunday'

    table.time('open_time').nullable()
    table.time('close_time').nullable()

    table.boolean('is_closed').notNullable().defaultTo(false)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    table.unique(['vendor_id', 'category'])
  })

  // Add CHECK constraint manually (PostgreSQL only)
  await knex.raw(`
    ALTER TABLE vendor_hours
    ADD CONSTRAINT category_check
    CHECK (category IN ('weekdays', 'saturday', 'sunday'))
  `)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('vendor_hours')
}
