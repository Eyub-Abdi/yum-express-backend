/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('orders', table => {
    table.increments('id').primary()

    table.integer('customer_id').unsigned().references('id').inTable('customers')

    table.integer('vendor_id').unsigned().references('id').inTable('vendors')

    table.decimal('total_price', 10, 2).notNullable()

    table.string('order_status').notNullable().defaultTo('pending')
    table.string('payment_status').notNullable().defaultTo('unpaid')

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('orders')
}
