const multer = require('multer')
const path = require('path')
const fs = require('fs')

function getUploadMiddleware(folderName) {
  const baseDir = path.join(__dirname, '..', '..', 'public', 'assets', folderName)

  // Configure Multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(baseDir, { recursive: true })
      cb(null, baseDir)
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`
      cb(null, uniqueName)
    }
  })

  // File filter for images
  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const ext = path.extname(file.originalname).toLowerCase()
    const mime = file.mimetype

    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed (jpg, jpeg, png, webp).'))
    }
  }

  // Return configured multer instance
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
  })
}

module.exports = getUploadMiddleware
