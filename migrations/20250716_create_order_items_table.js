/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('order_items', table => {
    table.increments('id').primary()

    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE') // Optional: Add this if you want cascading deletes for orders

    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE')

    table.integer('quantity').notNullable()
    table.decimal('price', 10, 2).notNullable()

    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_items')
}
