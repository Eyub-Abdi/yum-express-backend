/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('payments', table => {
    table.increments('id').primary()
    table.integer('order_id').unsigned().nullable().unique().references('id').inTable('orders').onDelete('CASCADE')
    table.decimal('amount', 10, 2).notNullable()
    table.string('payment_method', 20)
    table
      .enu('status', ['Pending', 'Completed', 'Failed', 'Cancelled'], {
        useNative: true,
        enumName: 'payment_status'
      })
      .defaultTo('Pending')
    table.string('transaction_id', 255).nullable().unique()
    table.string('order_reference', 255).nullable() // <-- New column for order reference
    table.string('message', 255).nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payments')
  await knex.raw('DROP TYPE IF EXISTS payment_status')
}
