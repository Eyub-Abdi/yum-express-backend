const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const { vendorRegistrationSchema, vendorUpdateSchema, vendorEmailUpdateSchema } = require('../schemas/vendorSchema')
const vendorQuerySchema = require('../schemas/vendorQuerySchema')
const updatePasswordSchema = require('../schemas/updatePasswordSchema')
const { sendVerificationEmail } = require('../services/emailService') // Import the email service
const { generateVerificationToken, generateVerificationTokenExpiry } = require('../services/tokenService') // Import token generation functions
const { verifyEmail } = require('../services/emailVerificationService')
const { validateId } = require('../utils/validateId')

const registerVendor = async (req, res) => {
  const { error } = vendorRegistrationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { first_name, last_name, email, phone, banner, address, latitude, longitude, category, business_name, password } = req.body

  // Check if the vendor already exists by email or phone number
  const existingVendor = await knex('vendors').where('email', email).orWhere('phone', phone).first()

  if (existingVendor) {
    return res.status(400).json({
      message: 'Vendor with this email or phone number already exists.'
    })
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Generate the verification token and expiry time
  const verificationToken = generateVerificationToken()
  const verificationTokenExpiry = generateVerificationTokenExpiry(48) // 1 hour validity

  // Insert the new vendor into the database
  const [newVendor] = await knex('vendors')
    .insert({
      first_name,
      last_name,
      email,
      phone,
      banner,
      address,
      latitude,
      longitude,
      category,
      business_name, // Added business_name field
      password_hash: hashedPassword,
      verification_token: verificationToken,
      verification_token_expiry: verificationTokenExpiry,
      verified: false, // Vendor is not verified by default
      is_active: true, // Default to active
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning('*')

  // Send the verification email
  try {
    await sendVerificationEmail(email, first_name, verificationToken, 'vendors')
  } catch (err) {
    console.error('Error sending verification email:', err)
  }

  // Return success message
  return res.status(201).json({
    message: 'Vendor registered successfully! Please verify your email.',
    vendor: {
      id: newVendor.id,
      first_name: newVendor.first_name,
      last_name: newVendor.last_name,
      email: newVendor.email,
      phone: newVendor.phone,
      banner: newVendor.banner,
      address: newVendor.address,
      latitude: newVendor.latitude,
      longitude: newVendor.longitude,
      category: newVendor.category,
      business_name: newVendor.business_name, // Included business_name in the response
      is_active: newVendor.is_active,
      created_at: newVendor.created_at,
      updated_at: newVendor.updated_at,
      verified: newVendor.verified
    }
  })
}

const getVendorsWithFilter = async (req, res) => {
  // Validate query parameters using the schema's method
  const { isValid, message, value } = vendorQuerySchema.validateQuery(req.query)
  if (!isValid) {
    return res.status(400).json({ error: message })
  }

  const { category, sortBy, order, page, limit } = value

  // Build query
  let query = knex('vendors')

  // Apply category filter if provided
  if (category) {
    query = query.where('category', category)
  }

  // Apply sorting
  query = query.orderBy(sortBy, order)

  // Apply pagination
  query = query.offset((page - 1) * limit).limit(limit)

  // Explicitly select only the required fields (avoid sensitive data like password, etc.)
  query = query.select('id', 'business_name', 'category', 'email', 'phone', 'address', 'created_at', 'updated_at')

  // Fetch vendors from the database
  const vendors = await query

  // If no vendors are found, return a 404 error
  if (vendors.length === 0) {
    return res.status(404).json({ message: 'No vendors found' })
  }

  // Respond with the filtered and paginated list of vendors
  res.json(vendors)
}

const getVendorById = async (req, res) => {
  const { id } = req.params

  // Validate the ID format
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  // Retrieve the vendor by ID
  const vendor = await knex('vendors').select('id', 'first_name', 'last_name', 'email', 'phone', 'banner', 'address', 'latitude', 'longitude', 'category', 'business_name', 'is_active', 'verified', 'created_at', 'updated_at').where({ id }).first()

  // If vendor not found, return a 404 error
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // Return the vendor data
  res.json(vendor)
}

const updateVendor = async (req, res) => {
  const { id } = req.params

  // Validate the ID
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  // Validate the request body with the schema
  const { error } = vendorUpdateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  // Check if the vendor exists
  const vendor = await knex('vendors').where({ id }).first()
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // Update vendor details excluding the password
  await knex('vendors')
    .where({ id })
    .update({
      first_name: req.body.first_name || vendor.first_name,
      last_name: req.body.last_name || vendor.last_name,
      phone: req.body.phone || vendor.phone,
      banner: req.body.banner || vendor.banner,
      address: req.body.address || vendor.address,
      latitude: req.body.latitude || vendor.latitude,
      longitude: req.body.longitude || vendor.longitude,
      category: req.body.category || vendor.category,
      business_name: req.body.business_name || vendor.business_name,
      updated_at: new Date()
    })

  res.json({ message: 'Vendor updated successfully' })
}

const updateVendorEmail = async (req, res) => {
  const { id } = req.params
  const { email } = req.body

  // Validate the ID
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }
  // Validate the email
  const { error } = vendorEmailUpdateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  // Check if the vendor exists
  const vendor = await knex('vendors').where({ id }).first()
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // Validate the new email
  const emailExists = await knex('vendors').where({ email }).first()
  if (emailExists) {
    return res.status(400).json({ message: 'Email is already in use' })
  }

  // Generate the verification token and expiry time
  const verificationToken = generateVerificationToken()
  const verificationTokenExpiry = generateVerificationTokenExpiry(48) // 48 hours validity

  // Prepare updated data
  const updatedData = {
    email,
    verification_token: verificationToken,
    verification_token_expiry: verificationTokenExpiry,
    verified: false, // Reset verification status
    updated_at: new Date()
  }

  // Update vendor's email and verification data
  await knex('vendors').where({ id }).update(updatedData)

  // Send verification email to the new email address
  try {
    await sendVerificationEmail(email, vendor.first_name, verificationToken, 'vendors')
  } catch (err) {
    return res.status(500).json({ message: 'Error sending verification email' })
  }

  res.json({ message: 'Email updated successfully. Please verify the new email address.' })
}

const deleteVendor = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  const deletedRows = await knex('vendors').where({ id }).del()

  if (!deletedRows) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  res.json({ message: 'Vendor deleted successfully' })
}

const deactivateOwnVendorAccount = async (req, res) => {
  const vendorId = req.user.id // Vendor ID from authentication

  // Get current status
  const vendor = await knex('vendors').select('is_active').where({ id: vendorId }).first()

  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  if (!vendor.is_active) {
    return res.status(400).json({ message: 'Account is already inactive' })
  }

  // Update vendor status to inactive
  await knex('vendors').where({ id: vendorId }).update({ is_active: false })

  res.json({ message: 'Account deactivated successfully' })
}

const updateVendorPassword = async (req, res) => {
  const { id } = req.user // Authenticated vendor ID
  const { old_password, new_password } = req.body

  // Validate request body
  const { error } = updatePasswordSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  // Fetch the vendor
  const vendor = await knex('vendors').where({ id }).select('password_hash').first()
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // Check if the old password matches
  const isMatch = await bcrypt.compare(old_password, vendor.password_hash)
  if (!isMatch) {
    return res.status(400).json({ message: 'Incorrect old password' })
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(new_password, 10)

  // Update the password in the database
  await knex('vendors').where({ id }).update({ password_hash: hashedPassword })

  res.json({ message: 'Password updated successfully' })
}

const verifyVendorEmail = async (req, res) => {
  await verifyEmail('vendors', req, res)
}

module.exports = {
  registerVendor,
  getVendorsWithFilter,
  getVendorById,
  updateVendor,
  updateVendorEmail,
  deleteVendor,
  deactivateOwnVendorAccount,
  updateVendorPassword,
  verifyVendorEmail
}
