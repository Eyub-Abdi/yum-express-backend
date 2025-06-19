// // middleware/validateSchema.js
// module.exports = schema => (req, res, next) => {
//   const { error } = schema.validate(req.body)

//   if (error) {
//     return res.status(400).json({ error: error.details[0].message })
//   }

//   next()
// }

const fs = require('fs')

const preUploadValidation = schema => (req, res, next) => {
  const { error } = schema.validate(req.body)

  if (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, err => {
        if (err) console.error('Failed to delete file after validation error:', err)
      })
    }

    return res.status(400).json({ error: error.details[0].message })
  }

  next()
}

module.exports = preUploadValidation
