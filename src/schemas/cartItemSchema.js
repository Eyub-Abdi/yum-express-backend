// schemas/cartItemSchema.js

const Joi = require('joi')

const cartItemSchema = Joi.object({
  cart_id: Joi.number().integer().positive().required().messages({
    'number.base': 'cart_id must be a number',
    'number.integer': 'cart_id must be an integer',
    'any.required': 'cart_id is required'
  }),
  product_id: Joi.number().integer().positive().required().messages({
    'number.base': 'product_id must be a number',
    'number.integer': 'product_id must be an integer',
    'any.required': 'product_id is required'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'quantity must be a number',
    'number.integer': 'quantity must be an integer',
    'number.min': 'quantity must be at least 1',
    'any.required': 'quantity is required'
  }),
  force: Joi.boolean()
})

const cartItemUpdateSchema = Joi.object({
  cart_id: Joi.number().integer().positive().required().messages({
    'number.base': 'cart_id must be a number',
    'number.integer': 'cart_id must be an integer',
    'any.required': 'cart_id is required'
  }),
  product_id: Joi.number().integer().positive().required().messages({
    'number.base': 'product_id must be a number',
    'number.integer': 'product_id must be an integer',
    'any.required': 'product_id is required'
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'quantity must be a number',
    'number.integer': 'quantity must be an integer',
    'number.min': 'quantity cannot be negative',
    'any.required': 'quantity is required'
  })
})

const updateCartItemsSchema = Joi.object({
  cart_id: Joi.number().required(),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    )
    .min(1)
    .required()
})

const cartItemRemoveSchema = Joi.object({
  cart_id: Joi.number().integer().positive().required(),
  product_id: Joi.number().integer().positive().required()
})

module.exports = { cartItemSchema, cartItemUpdateSchema, updateCartItemsSchema, cartItemRemoveSchema }
