/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('products', table => {
    table.increments('id').primary()
    table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('CASCADE')
    table.string('name', 255).notNullable()
    table.text('description')
    table.decimal('price', 10, 2).notNullable()
    table.text('image_url')
    table.integer('stock').notNullable().defaultTo(0)
    table.boolean('is_disabled').defaultTo(true)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at')
    table.integer('deleted_by').unsigned().references('id').inTable('admins').onDelete('SET NULL')
    table.integer('max_order_quantity').defaultTo(50)
    table.boolean('is_published').defaultTo(false)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('products')
}
