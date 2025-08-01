exports.up = async function (knex) {
  await knex.schema.alterTable('payments', table => {
    table.string('message', 255)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('payments', table => {
    table.dropColumn('message')
  })
}
