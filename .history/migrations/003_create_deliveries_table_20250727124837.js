// /**
//  * @param { import("knex").Knex } knex
//  * @returns { Promise<void> }
//  */
// exports.up = async function (knex) {
//   await knex.schema.createTable('deliveries', table => {
//     table.increments('id').primary()

//     table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE')

//     table.integer('customer_id').unsigned().notNullable().references('id').inTable('customers').onDelete('CASCADE')

//     table.integer('assigned_to').unsigned().references('id').inTable('drivers').onDelete('SET NULL')

//     table.integer('vendor_id').unsigned().notNullable().references('id').inTable('vendors').onDelete('CASCADE')

//     table.string('status', 20).notNullable().defaultTo('pending')
//     table.timestamp('estimated_time')
//     table.decimal('lat', 10, 8)
//     table.decimal('lng', 11, 8)

//     table.string('phone', 20).notNullable()
//     table.text('address').notNullable()
//     table.text('street_name')
//     table.text('delivery_notes')
//     table.timestamp('delivered_at')

//     // New confirmed_delivered column
//     table.boolean('confirmed_delivered').defaultTo(false)

//     table.timestamp('created_at').defaultTo(knex.fn.now())
//     table.timestamp('updated_at').defaultTo(knex.fn.now())
//   })
// }

// /**
//  * @param { import("knex").Knex } knex
//  * @returns { Promise<void> }
//  */
// exports.down = async function (knex) {
//   await knex.schema.dropTableIfExists('deliveries')
// }

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('deliveries', table => {
    table.increments('id').primary()

    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE')

    table.integer('customer_id').unsigned().notNullable().references('id').inTable('customers').onDelete('CASCADE')

    table.integer('assigned_to').unsigned().references('id').inTable('drivers').onDelete('SET NULL')

    table.integer('vendor_id').unsigned().notNullable().references('id').inTable('vendors').onDelete('CASCADE')

    table.string('status', 20).notNullable().defaultTo('pending')
    table.timestamp('estimated_time')
    table.decimal('lat', 10, 8)
    table.decimal('lng', 11, 8)

    table.string('phone', 20).notNullable()
    table.text('address').notNullable()
    table.text('street_name')
    table.text('delivery_notes')
    table.decimal('delivery_fee', 10, 2).notNullable().defaultTo(0)
    table.decimal('distance_km', 10, 2).notNullable().defaultTo(0)
    table.boolean('confirmed_delivered').defaultTo(false)
    table.timestamp('delivered_at')

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('deliveries')
}
