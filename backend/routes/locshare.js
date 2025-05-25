const express = require('express');
const { v4: uuidv4 } = require('uuid');
const upload = require('../config/multer');
const File = require('../models/File');
const os = require('os');

const router = express.Router();

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let iface of Object.values(interfaces)) {
    for (let config of iface) {
      if (config.family === 'IPv4' && !config.internal) return config.address;
    }
  }
  return 'localhost';
}

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { expireSeconds = 1800, password } = req.body;
    const expireAt = new Date(Date.now() + expireSeconds * 1000);

    const doc = await File.create({
      originalName: file.originalname,
      storageName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      expireAt,
    });

    const keyData = {
      fileId: doc._id.toString(),
      host: getLocalIP(),
      port: process.env.PORT || 3000,
      password: password || null,
    };

    const accessKey = Buffer.from(JSON.stringify(keyData)).toString('base64');
    res.json({ accessKey, expiresIn: expireSeconds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'LocShare upload failed' });
  }
});

module.exports = router;
