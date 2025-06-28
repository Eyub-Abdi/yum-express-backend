const knex = require('../db/knex')
const { adminVendorQuerySchema } = require('../schemas/adminVendorQuerySchema')
const { banVendorSchema } = require('../schemas/banVendorSchema')
const { activateDeactivateVendorSchema } = require('../schemas/activateDeactivateVendorSchema')
const { validateId } = require('../utils/validateId')

const getAllVendorsForAdmin = async (req, res) => {
  const { error, value } = adminVendorQuerySchema.validate(req.query)

  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  const { page, limit, search, verified, is_active } = value
  const offset = (page - 1) * limit

  const query = knex('vendors').select('id', 'first_name', 'last_name', 'business_name', 'email', 'phone', 'banner', 'address', 'location', 'lat', 'lng', 'category', 'is_banned', 'verified', 'is_active', 'created_at', 'deleted_at')

  if (search) {
    query.whereILike('business_name', `%${search}%`)
  }

  if (verified !== undefined) {
    query.andWhere('verified', verified === 'true')
  }

  if (is_active !== undefined) {
    query.andWhere('is_active', is_active === 'true')
  }

  const totalQuery = query.clone().clearSelect().count('id as count')
  const totalResult = await totalQuery.first()
  const total = Number(totalResult.count)

  const vendors = await query.orderBy('created_at', 'desc').limit(limit).offset(offset)

  res.json({
    page,
    limit,
    total,
    vendors
  })
}

const getVendorByIdForAdmin = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid vendor ID' })
  }

  const vendor = await knex('vendors').select('id', 'business_name', 'first_name', 'last_name', 'email', 'phone', 'address', 'lat', 'lng', 'location', 'banner', 'category', 'is_banned', 'is_active', 'verified', 'created_at', 'updated_at', 'deleted_at').where({ id }).first()

  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  res.json({ vendor })
}

const banVendor = async (req, res) => {
  const { id } = req.params

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid vendor ID' })
  }

  const { error, value } = banVendorSchema.validate(req.body)

  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { ban } = value

  const vendor = await knex('vendors').where({ id }).first()

  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  if (vendor.is_banned === ban) {
    return res.status(400).json({
      message: ban ? 'Vendor is already banned.' : 'Vendor is not banned.'
    })
  }

  await knex('vendors').where({ id }).update({ is_banned: ban, updated_at: new Date() })

  res.json({
    message: ban ? 'Vendor has been banned.' : 'Vendor has been unbanned.',
    vendor_id: id,
    is_banned: ban
  })
}

const activateDeactivateVendor = async (req, res) => {
  const { id } = req.params

  // Validate vendor ID
  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid vendor ID' })
  }

  // Validate the request body to ensure it has 'active' property
  const { error, value } = activateDeactivateVendorSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  const { active } = value

  // Check if the vendor exists in the database
  const vendor = await knex('vendors').where({ id }).first()
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  // Prevent reactivation or deactivation if the vendor is already in the requested state
  if (vendor.is_active === active) {
    return res.status(400).json({
      message: active ? 'Vendor is already active.' : 'Vendor is already inactive.'
    })
  }

  // Update the vendor's active status in the database
  await knex('vendors').where({ id }).update({
    is_active: active,
    updated_at: new Date() // Update the timestamp
  })

  // Send response based on the action performed
  res.json({
    message: active ? 'Vendor has been activated.' : 'Vendor has been deactivated.',
    vendor_id: id,
    is_active: active
  })
}

const softDeleteVendor = async (req, res) => {
  const { id } = req.params
  const adminId = req.user?.id

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid vendor ID' })
  }

  if (!adminId) {
    return res.status(401).json({ message: 'Unauthorized: admin ID missing' })
  }

  const vendor = await knex('vendors').where({ id }).first()
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  if (vendor.deleted_at) {
    return res.status(400).json({ message: 'Vendor already deleted' })
  }

  await knex('vendors').where({ id }).update({
    deleted_at: new Date(),
    deleted_by: adminId,
    is_active: false,
    updated_at: new Date()
  })

  res.json({
    message: 'Vendor soft deleted successfully',
    vendor_id: id
  })
}

const restoreVendor = async (req, res) => {
  const { id } = req.params
  const adminId = req.user?.id

  if (!validateId(id)) {
    return res.status(400).json({ message: 'Invalid vendor ID' })
  }

  if (!adminId) {
    return res.status(401).json({ message: 'Unauthorized: admin ID missing' })
  }

  const vendor = await knex('vendors').where({ id }).first()

  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' })
  }

  if (!vendor.deleted_at) {
    return res.status(400).json({ message: 'Vendor is not deleted' })
  }

  await knex('vendors').where({ id }).update({
    deleted_at: null,
    deleted_by: null,
    is_active: true,
    updated_at: new Date()
  })

  res.json({
    message: 'Vendor restored successfully',
    vendor_id: id
  })
}

module.exports = { getAllVendorsForAdmin, getVendorByIdForAdmin, banVendor, activateDeactivateVendor, softDeleteVendor, restoreVendor }
