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

// File size limit for Vercel serverless (4MB)
const fileSizeLimit = process.env.VERCEL ? 4 * 1024 * 1024 : 100 * 1024 * 1024; // 4MB on Vercel, 100MB locally

module.exports = multer({ 
  storage,
  limits: {
    fileSize: fileSizeLimit
  }
});
