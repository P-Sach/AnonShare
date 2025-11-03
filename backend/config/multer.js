const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const getUploadDir = require('../utils/uploadPath');

// Get upload directory (handles serverless vs local)
const uploadDir = getUploadDir();

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// disk storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, name + ext);
  }
});

module.exports = multer({ storage });
