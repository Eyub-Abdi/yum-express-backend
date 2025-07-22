const bcrypt = require('bcrypt')
const knex = require('../db/knex')
const dayjs = require('dayjs')
const { vendorUpdateSchema, vendorEmailUpdateSchema, vendorLocationSchema } = require('../schemas/vendorSchema')
const vendorQuerySchema = require('../schemas/vendorQuerySchema')
const updatePasswordSchema = require('../schemas/updatePasswordSchema')
const { nameUpdateSchema, businessNameSchema, phoneUpdateSchema, businessHoursSchema, addressUpdateSchema } = require('../schemas/vendorProfileUpdateSchema')

const { sendVerificationEmail, sendEmail } = require('../services/emailService') // Import the email service
const { generateVerificationToken, generateVerificationTokenExpiry } = require('../services/tokenService') // Import token generation functions
const { verifyEmail } = require('../services/emailVerificationService')
const { buildWelcomeMessage } = require('../utils/welcomeMessages')
const { validateId } = require('../utils/validateId')
const generateDefaultPassword = require('../utils/passwordGenerator')
const { sendSMS } = require('../services/smsService')
const generateOtp = require('../utils/otpGenerator')
const path = require('path')
const fs = require('fs')

const registerVendor = async (req, res) => {
  // const { error } = vendorRegistrationSchema.validate(req.body)
  // if (error) {
  //   return res.status(400).json({ error: error.details[0].message })
  // }

  const { first_name, last_name, email, phone, banner, address, category, business_name } = req.body

  // Check for existing vendor
  const existingVendor = await knex('vendors').where('email', email).orWhere('phone', phone).first()

  if (existingVendor) {
    return res.status(400).json({
      message: 'Vendor with this email or phone already exists.'
    })
  }

  // Hash password
  const password = generateDefaultPassword()
  const hashedPassword = await bcrypt.hash(password, 10)

  // Generate verification token
  const verificationToken = generateVerificationToken()
  const verificationTokenExpiry = generateVerificationTokenExpiry(48)

  // Insert into DB
  const [newVendor] = await knex('vendors')
    .insert({
      first_name,
      last_name,
      email,
      phone,
      banner,
      address,
      category,
      business_name,
      password_hash: hashedPassword,
      verification_token: verificationToken,
      verification_token_expiry: verificationTokenExpiry,
      verified: false,
      is_active: false,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning('*')
  const message = buildWelcomeMessage(first_name, password)
  const smsResponse = await sendSMS(phone, message)
  // Send verification email
  try {
    await sendEmail({ recipientEmail: email, firstName: first_name, type: 'verification', payload: { token: verificationToken, entityType: 'vendors' } })
  } catch (err) {
    console.error('Error sending verification email:', err)
  }

  //Return vendor
  return res.status(201).json({
    message: 'Vendor registered successfully!',
    vendor: {
      id: newVendor.id,
      first_name: newVendor.first_name,
      last_name: newVendor.last_name,
      email: newVendor.email,
      phone: newVendor.phone,
      banner: newVendor.banner,
      address: newVendor.address,
      category: newVendor.category,
      business_name: newVendor.business_name,
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
  query = query.select('id', 'business_name', 'category', 'banner', 'email', 'phone', 'address', 'created_at', 'updated_at')

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
  const vendor = await knex('vendors').select('id', 'first_name', 'last_name', 'email', 'phone', 'banner', 'address', 'lat', 'lng', 'category', 'business_name', 'is_active', 'verified', 'created_at', 'updated_at').where({ id }).first()

  // If vendor not found, return a 404 error
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // Return the vendor data
  res.json(vendor)
}

const updateVendor = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  const { error } = vendorUpdateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const vendor = await knex('vendors').where({ id }).first()
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  const updateData = {
    first_name: req.body.first_name || vendor.first_name,
    last_name: req.body.last_name || vendor.last_name,
    // phone: req.body.phone || vendor.phone,
    address: req.body.address || vendor.address,
    category: req.body.category || vendor.category,
    business_name: req.body.business_name || vendor.business_name,
    updated_at: new Date()
  }

  // === Handle banner replacement ===
  if (req.file) {
    // Delete old banner if exists
    if (vendor.banner) {
      const oldPath = path.join(__dirname, '..', '..', 'public', vendor.banner)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    // Save new banner path
    updateData.banner = req.file.filename
  }

  await knex('vendors').where({ id }).update(updateData)

  const updatedVendor = await knex('vendors').select('id', 'first_name', 'last_name', 'email', 'phone', 'banner', 'address', 'lat', 'lng', 'category', 'business_name', 'is_active', 'verified', 'created_at', 'updated_at').where({ id }).first()

  res.json({ message: 'Vendor updated successfully', vendor: updatedVendor })
}

const updateVendorEmail = async (req, res) => {
  const { id } = req.user
  const { email } = req.body
  console.log(req.user)

  // 2. Validate the email format
  const { error } = vendorEmailUpdateSchema.validate({ email })
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  // 3. Check vendor existence
  const vendor = await knex('vendors').where({ id }).first()
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // 4. Ensure email is not already in use
  const emailTaken = await knex('vendors').where({ email }).andWhereNot({ id }).first()
  if (emailTaken) {
    return res.status(400).json({ message: 'Email is already in use' })
  }

  // 5. Generate OTP and expiry
  const { code, expiry } = generateOtp(10) // 10 minutes

  // 6. Update vendor with new email, otp, and mark unverified
  await knex('vendors').where({ id }).update({
    email,
    otp_code: code,
    otp_expiry: expiry,
    verified: false,
    updated_at: new Date()
  })

  // 7. Send OTP via email
  try {
    // await sendOtpEmail(email, vendor.first_name, code)
    await sendEmail({
      recipientEmail: email,
      firstName: vendor.first_name,
      type: 'otp',
      payload: {
        otp: code,
        expiresIn: 10
      }
    })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send OTP email' })
  }

  res.json({ message: 'Verification code sent to new email. Please verify.' })
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

const getNearbyVendors = async (req, res) => {
  // Validate query parameters
  const { error, value } = vendorLocationSchema.validate(req.query)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { lat, lon, category } = value

  // Convert to geography type for meter-based distance calculations
  let query = knex('vendors')
    .select(
      'id',
      'business_name',
      'lat',
      'lng',
      'category',
      knex.raw(
        `
        ST_Distance(
          location::geography, 
          ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
        ) AS distance
      `,
        [lon, lat]
      )
    )
    .whereRaw(
      `
      ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
        5000
      )
    `,
      [lon, lat]
    )

  // Apply category filter if provided
  if (category) {
    query = query.where('category', category)
  }

  // Fetch vendors from the database
  const vendors = await query

  if (vendors.length === 0) {
    return res.status(404).json({ message: 'No nearby vendors found' })
  }

  // Sort vendors first by category, then by distance
  vendors.sort((a, b) => {
    if (a.category === b.category) {
      return a.distance - b.distance
    }
    return a.category.localeCompare(b.category)
  })

  res.json(vendors)
}

const getVendorProfile = async (req, res) => {
  const { id } = req.user

  const vendor = await knex('vendors').where({ id }).first()

  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found' })
  }

  const { password_hash, verification_token, verification_token_expiry, ...vendorProfile } = vendor

  res.json({ vendor: vendorProfile })
}

// ====VENDOR PROFILE UPDATION====

const updateVendorName = async (req, res, next) => {
  const { error } = nameUpdateSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const { first_name, last_name } = req.body
  const id = req.user.id

  await knex('vendors').where({ id }).update({
    first_name,
    last_name,
    updated_at: new Date()
  })

  res.json({ message: 'Name updated successfully' })
}

const updateBusinessName = async (req, res, next) => {
  const { error } = businessNameSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const { business_name } = req.body
  const id = req.user.id

  await knex('vendors').where({ id }).update({
    business_name,
    updated_at: new Date()
  })

  res.json({ message: 'Business name updated successfully' })
}

const updateVendorPhone = async (req, res) => {
  const { id } = req.user
  const { phone } = req.body

  // 1. Validate phone format
  const { error } = phoneUpdateSchema.validate({ phone })
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  // 2. Check if vendor exists
  const vendor = await knex('vendors').where({ id }).first()
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // 3. Ensure phone number is not already taken
  const phoneTaken = await knex('vendors').where({ phone }).andWhereNot({ id }).first()
  if (phoneTaken) {
    return res.status(400).json({ message: 'Phone number is already in use' })
  }

  // 4. Generate OTP and expiry
  const { code, expiry } = generateOtp(5) // 10 minutes

  // 5. Update the vendor with new phone and OTP
  await knex('vendors').where({ id }).update({
    phone,
    otp_code: code,
    otp_expiry: expiry,
    verified: false,
    updated_at: new Date()
  })

  // 6. Send OTP via SMS
  const otpMessage = `Yum Express: Your varification code is ${code}`

  try {
    await sendSMS(phone.replace('+', ''), otpMessage) // assumes number like '2556...'
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send OTP SMS' })
  }

  res.json({ message: 'Verification code sent to your new phone. Please verify.' })
}

const updateVendorAddress = async (req, res, next) => {
  const { error } = addressUpdateSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const { address } = req.body
  const id = req.user.id

  await knex('vendors').where({ id }).update({
    address,
    updated_at: new Date()
  })

  res.json({ message: 'Address updated successfully' })
}

// const updateVendorHours = async (req, res, next) => {
//   const { error } = vendorHourSchema.validate(req.body)
//   if (error) return res.status(400).json({ error: error.details[0].message })

//   const vendor_id = req.user.id
//   const hoursData = req.body
//   const categories = ['weekdays', 'saturday', 'sunday']

//   for (const category of categories) {
//     const { open_time, close_time } = hoursData[category]

//     const existing = await knex('vendor_hours').where({ vendor_id, category }).first()

//     if (existing) {
//       await knex('vendor_hours').where({ vendor_id, category }).update({
//         open_time,
//         close_time,
//         updated_at: new Date()
//       })
//     } else {
//       await knex('vendor_hours').insert({
//         vendor_id,
//         category,
//         open_time,
//         close_time,
//         created_at: new Date(),
//         updated_at: new Date()
//       })
//     }
//   }

//   res.json({ message: 'Vendor hours updated successfully' })
// }

// const updateVendorHours = async (req, res, next) => {
//   const { error } = businessHoursSchema.validate(req.body)
//   if (error) return res.status(400).json({ error: error.details[0].message })

//   const vendor_id = req.user.id
//   const hoursData = req.body
//   const categories = ['weekdays', 'saturday', 'sunday']

//   for (const category of categories) {
//     const { open_time, close_time, is_closed } = hoursData[category]

//     const existing = await knex('vendor_hours').where({ vendor_id, category }).first()

//     if (existing) {
//       await knex('vendor_hours')
//         .where({ vendor_id, category })
//         .update({
//           open_time: is_closed ? null : open_time,
//           close_time: is_closed ? null : close_time,
//           is_closed,
//           updated_at: new Date()
//         })
//     } else {
//       await knex('vendor_hours').insert({
//         vendor_id,
//         category,
//         open_time: is_closed ? null : open_time,
//         close_time: is_closed ? null : close_time,
//         is_closed,
//         created_at: new Date(),
//         updated_at: new Date()
//       })
//     }
//   }

//   res.json({ message: 'Vendor hours updated successfully' })
// }

const updateVendorHours = async (req, res) => {
  const { error } = businessHoursSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const vendor_id = req.user.id
  const hoursData = req.body

  const validCategories = ['weekdays', 'saturday', 'sunday']
  const categories = Object.keys(hoursData).filter(cat => validCategories.includes(cat))

  for (const category of categories) {
    const { open_time, close_time, is_closed } = hoursData[category]
    const existing = await knex('vendor_hours').where({ vendor_id, category }).first()

    if (existing) {
      await knex('vendor_hours')
        .where({ vendor_id, category })
        .update({
          open_time: is_closed ? null : open_time,
          close_time: is_closed ? null : close_time,
          is_closed,
          updated_at: new Date()
        })
    } else {
      await knex('vendor_hours').insert({
        vendor_id,
        category,
        open_time: is_closed ? null : open_time,
        close_time: is_closed ? null : close_time,
        is_closed,
        created_at: new Date(),
        updated_at: new Date()
      })
    }
  }

  res.json({ message: 'Vendor hours updated successfully' })
}
const getVendorHours = async (req, res) => {
  const vendor_id = req.params.id

  if (!validateId(vendor_id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  const rows = await knex('vendor_hours').where({ vendor_id }).select('category', 'open_time', 'close_time', 'is_closed')

  const result = {}
  for (const row of rows) {
    result[row.category] = {
      open_time: row.open_time,
      close_time: row.close_time,
      is_closed: row.is_closed
    }
  }

  const day = dayjs().day() // 0 = Sunday, 6 = Saturday
  const todayCategory = day === 0 ? 'sunday' : day === 6 ? 'saturday' : 'weekdays'
  const todayHours = result[todayCategory]

  let is_open = false

  if (todayHours && !todayHours.is_closed && todayHours.open_time && todayHours.close_time) {
    const now = dayjs()
    const currentMinutes = now.hour() * 60 + now.minute()

    const [openHour, openMinute] = todayHours.open_time.split(':').map(Number)
    const [closeHour, closeMinute] = todayHours.close_time.split(':').map(Number)

    const openMinutes = openHour * 60 + openMinute
    const closeMinutes = closeHour * 60 + closeMinute

    is_open = currentMinutes >= openMinutes && currentMinutes < closeMinutes
  }

  res.json({
    is_open,
    current_day: todayCategory,
    hours: result
  })
}

// const getVendorHours = async (req, res) => {
//   const vendor_id = req.params.id

//   if (!validateId(vendor_id)) {
//     return res.status(400).json({ message: 'Invalid ID format' })
//   }

//   const rows = await knex('vendor_hours').where({ vendor_id }).select('category', 'open_time', 'close_time', 'is_closed')

//   const result = {}
//   for (const row of rows) {
//     result[row.category] = {
//       open_time: row.open_time,
//       close_time: row.close_time,
//       is_closed: row.is_closed
//     }
//   }

//   const day = dayjs().day() // 0 = Sunday, 6 = Saturday
//   const todayCategory = day === 0 ? 'sunday' : day === 6 ? 'saturday' : 'weekdays'
//   const todayHours = result[todayCategory]

//   let is_open = false

//   if (todayHours && !todayHours.is_closed && todayHours.open_time && todayHours.close_time) {
//     const now = dayjs()
//     const todayStr = now.format('YYYY-MM-DD')
//     const open = dayjs(`${todayStr}T${todayHours.open_time}`)
//     const close = dayjs(`${todayStr}T${todayHours.close_time}`)

//     is_open = now.isAfter(open) && now.isBefore(close)
//   }

//   res.json({
//     is_open,
//     current_day: todayCategory,
//     hours: result
//   })
// }

module.exports = {
  registerVendor,
  getVendorsWithFilter,
  getVendorById,
  getNearbyVendors,
  updateVendor,
  updateVendorEmail,
  deleteVendor,
  getVendorProfile,
  deactivateOwnVendorAccount,
  updateVendorPassword,
  verifyVendorEmail,

  // ====VENDOR PROFILE UPDATION====
  updateVendorName,
  updateBusinessName,
  updateVendorPhone,
  updateVendorHours,
  getVendorHours,
  updateVendorAddress
}
