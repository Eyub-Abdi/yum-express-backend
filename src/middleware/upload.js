const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Define the path to store uploaded images (outside src/)
const imageDir = path.join(__dirname, '..', '..', 'public', 'assets', 'images')

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists
    fs.mkdirSync(imageDir, { recursive: true })
    cb(null, imageDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

// Create the Multer middleware
const upload = multer({ storage })

module.exports = upload
