/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('reviews', table => {
    table.increments('id').primary()
    table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('CASCADE')
    table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('CASCADE')
    table.integer('rating').notNullable()
    table.text('comment')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable()
  })

  // Add CHECK constraint for rating after table creation
  await knex.raw(`ALTER TABLE reviews ADD CONSTRAINT rating_check CHECK (rating >= 1 AND rating <= 5)`)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('reviews')
}
