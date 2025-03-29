const knex = require('../db/knex')
const { reviewSchema, reviewUpdateSchema } = require('../schemas/reviewSchema')
const { validateId } = require('../utils/validateId')

const submitReview = async (req, res) => {
  // Ensure only customers can submit reviews
  if (req.user.type !== 'customer') {
    return res.status(403).json({ message: 'Only customers can submit reviews' })
  }

  // Validate the input (excluding customer_id)
  const { error, value } = reviewSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { vendor_id, rating, comment } = value
  const customer_id = req.user.id // Get customer ID from authenticated user

  // Ensure that the vendor exists
  const vendorExists = await knex('vendors').where('id', vendor_id).first()
  if (!vendorExists) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // Prevent vendors from reviewing their own businesses
  if (customer_id === vendor_id) {
    return res.status(400).json({ message: 'Vendors cannot review their own business' })
  }

  // Check if the customer has already submitted a review for this vendor
  const existingReview = await knex('reviews').where({ customer_id, vendor_id }).first()

  if (existingReview) {
    return res.status(400).json({ message: 'You have already reviewed this vendor' })
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

const getVendorReviews = async (req, res) => {
  const { vendor_id } = req.params

  // Validate vendor_id
  if (!validateId(vendor_id)) {
    return res.status(400).json({ message: 'Invalid vendor ID' })
  }

  // Check if vendor exists
  const vendorExists = await knex('vendors').where('id', vendor_id).first()
  if (!vendorExists) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // Fetch reviews with customer first_name and last_name
  const reviews = await knex('reviews')
    .select(
      'reviews.id',
      'reviews.customer_id',
      'customers.first_name',
      'customers.last_name', // Added last_name
      'reviews.rating',
      'reviews.comment',
      'reviews.created_at'
    )
    .leftJoin('customers', 'reviews.customer_id', 'customers.id')
    .where('reviews.vendor_id', vendor_id)

  // Calculate average rating dynamically
  const avgRatingResult = await knex('reviews').where('vendor_id', vendor_id).avg('rating as avg_rating').first()

  const avgRating = avgRatingResult.avg_rating ? parseFloat(avgRatingResult.avg_rating).toFixed(1) : 'No reviews yet'

  return res.status(200).json({
    vendor_id,
    average_rating: avgRating,
    total_reviews: reviews.length,
    reviews: reviews.map(review => ({
      ...review,
      customer_name: `${review.first_name} ${review.last_name}` // Combine first and last name
    }))
  })
}

const editReview = async (req, res) => {
  const { review_id } = req.params
  const customer_id = req.user.id // Get logged-in customer ID

  // Validate review_id using your custom function
  if (!validateId(review_id)) {
    return res.status(400).json({ message: 'Invalid review ID' })
  }

  // Validate the input
  const { error, value } = reviewUpdateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { rating, comment } = value

  // Check if the review exists and belongs to the customer
  const review = await knex('reviews').where('id', review_id).first()
  if (!review) {
    return res.status(404).json({ message: 'Review not found' })
  }

  if (review.customer_id !== customer_id) {
    return res.status(403).json({ message: 'You can only edit your own review' })
  }

  // Update the review
  const [updatedReview] = await knex('reviews').where('id', review_id).update({ rating, comment, updated_at: new Date() }).returning('*')

  return res.status(200).json({ message: 'Review updated successfully', review: updatedReview })
}

const deleteReview = async (req, res) => {
  const { review_id } = req.params
  const customer_id = req.user.id // Get logged-in customer ID
  console.log(customer_id)
  // Validate review_id
  if (!validateId(review_id)) {
    return res.status(400).json({ message: 'Invalid review ID' })
  }

  // Check if the review exists and belongs to the customer
  const review = await knex('reviews').where('id', review_id).first()
  if (!review) {
    return res.status(404).json({ message: 'Review not found' })
  }
  console.log(review.customer_id)
  if (review.customer_id !== customer_id) {
    return res.status(403).json({ message: 'You can only delete your own review' })
  }

  // Delete the review
  await knex('reviews').where('id', review_id).del()

  return res.status(200).json({ message: 'Review deleted successfully' })
}

module.exports = { submitReview, getVendorReviews, editReview, deleteReview }
