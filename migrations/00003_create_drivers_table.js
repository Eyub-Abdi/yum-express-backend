/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('drivers', table => {
    table.increments('id').primary()

    table.string('first_name', 255).notNullable()
    table.string('last_name', 255).notNullable()
    table.string('email', 255).notNullable().unique()
    table.string('phone', 20).notNullable().unique()
    table.text('vehicle_details')

    table.boolean('is_active').defaultTo(true)

    table.text('password_hash').notNullable()

    table.string('status', 50).notNullable().defaultTo('active')
    table.boolean('verified').notNullable().defaultTo(false)

    table.string('verification_token', 255)
    table.timestamp('verification_token_expiry')

    table.timestamp('deleted_at')
    table.integer('deleted_by').unsigned().references('id').inTable('admins').onDelete('SET NULL')

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    table.check("status in ('active', 'on_delivery', 'inactive')")
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('drivers')
}
