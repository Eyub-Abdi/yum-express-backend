/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('vendors', table => {
    table.increments('id').primary()
    table.string('first_name', 255).notNullable()
    table.string('last_name', 255).notNullable()
    table.string('email', 255).notNullable().unique()
    table.string('phone', 20).notNullable().unique()
    table.text('banner')
    table.text('address')
    table.decimal('lat', 10, 8)
    table.decimal('lng', 11, 8)
    table.string('category', 50)
    table.boolean('is_active').defaultTo(true)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.string('password_hash', 255).notNullable()
    table.string('verification_token', 255)
    table.timestamp('verification_token_expiry')
    table.boolean('verified').defaultTo(false)
    table.string('business_name', 255).notNullable()
    table.specificType('location', 'geometry(Point,4326)')
    table.boolean('is_banned').defaultTo(false)
    table.timestamp('deleted_at')
    table.integer('deleted_by').unsigned()
    table.string('otp_code', 10)
    table.timestamp('otp_expiry')

    // Foreign key constraints
    table.foreign('deleted_by').references('admins.id')
  })

  // Additional indexes (optional, since unique on email and phone are already indexes)
  await knex.schema.alterTable('vendors', table => {
    table.index('email', 'idx_vendors_email')
    table.index('phone', 'idx_vendors_phone')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('vendors')
}
