const knex = require('../db/knex')
const reviewSchema = require('../schemas/reviewSchema')

const submitReview = async (req, res) => {
  // Validate the input
  const { error, value } = reviewSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { customer_id, vendor_id, rating, comment } = value

  // Ensure that the customer and vendor exist
  const customerExists = await knex('customers').where('id', customer_id).first()
  const vendorExists = await knex('vendors').where('id', vendor_id).first()

  if (!customerExists || !vendorExists) {
    return res.status(404).json({ message: 'Customer or Vendor not found' })
  }

  // Insert the review into the reviews table
  const [newReview] = await knex('reviews')
    .insert({
      customer_id,
      vendor_id,
      rating,
      comment,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning('*')

  return res.status(201).json({ message: 'Review submitted successfully', review: newReview })
}
module.exports = { submitReview }
