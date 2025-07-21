/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('cart_items', table => {
    table.increments('id').primary()
    table.integer('cart_id').notNullable().references('id').inTable('carts').onDelete('CASCADE')
    table.integer('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE')
    table.integer('quantity').notNullable().defaultTo(1)
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('cart_items')
}
