// /**
//  * @param { import("knex").Knex } knex
//  * @returns { Promise<void> }
//  */
// exports.up = async function (knex) {
//   await knex.schema.createTable('pending_payments', table => {
//     table.increments('id').primary()

//     table.string('order_reference').notNullable().unique()

//     table.integer('cart_id').unsigned().notNullable().references('id').inTable('carts').onDelete('CASCADE')

//     table.string('transaction_id', 100).nullable()

//     table.decimal('amount', 10, 2).notNullable()

//     table.decimal('delivery_fee', 10, 2).defaultTo(0)

//     table.decimal('distance_km', 10, 2).defaultTo(0)

//     table.timestamp('created_at').defaultTo(knex.fn.now())
//   })
// }

// /**
//  * @param { import("knex").Knex } knex
//  * @returns { Promise<void> }
//  */
// exports.down = async function (knex) {
//   await knex.schema.dropTableIfExists('pending_payments')
// }

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('pending_payments', table => {
    table.increments('id').primary()

    table.string('order_reference', 100).notNullable().unique()

    table.integer('cart_id').unsigned().notNullable().references('id').inTable('carts').onDelete('CASCADE')

    table.string('transaction_id', 100).nullable()

    table.decimal('amount', 10, 2).notNullable()

    table.decimal('delivery_fee', 10, 2).defaultTo(0)

    table.decimal('distance_km', 10, 2).defaultTo(0)

    table.string('phone', 20).nullable()

    table.string('address', 255).nullable()

    table.string('street_name', 255).nullable()

    table.text('delivery_notes').nullable()

    table.decimal('lat', 10, 7).nullable()

    table.decimal('lng', 10, 7).nullable()

    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pending_payments')
}
