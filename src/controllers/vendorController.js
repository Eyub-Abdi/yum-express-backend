const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const vendorRegistrationSchema = require('../schemas/vendorSchema')
const { sendVerificationEmail } = require('../services/emailService') // Import the email service
const { generateVerificationToken, generateVerificationTokenExpiry } = require('../services/tokenService') // Import token generation functions

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
  const verificationTokenExpiry = generateVerificationTokenExpiry() // 1 hour validity

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
    await sendVerificationEmail(email, verificationToken)
    console.log('Verification email sent to:', email)
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

module.exports = {
  registerVendor
}
