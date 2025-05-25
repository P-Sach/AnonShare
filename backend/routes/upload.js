const express = require('express');
const { v4: uuidv4 } = require('uuid');
const upload = require('../config/multer');
const File   = require('../models/File');
const redis  = require('../utils/redisClient');
const QRCode = require('qrcode');
const router = express.Router();
const bcrypt = require('bcrypt');
// expects multipart‑form with field “file” and “expireSeconds”
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const expireSeconds = parseInt(req.body.expireSeconds, 10) || 3600;
    const expireAt = new Date(Date.now() + expireSeconds*1000);
    const passwordHash = req.body.password
      ? await bcrypt.hash(req.body.password, 10)
      : null;

    const maxDownloads = req.body.maxDownloads
      ? parseInt(req.body.maxDownloads)
      : null;
    // save metadata in Mongo
    const doc = await File.create({
      originalName: file.originalname,
      storageName:  file.filename,
      mimeType:     file.mimetype,
      size:         file.size,
      expireAt:     expireAt,
      passwordHash,
      maxDownloads,
    });

    // generate session key & store mapping in Redis
    const sessionId = uuidv4();
    await redis.set(sessionId, doc._id.toString(), 'EX', expireSeconds);
    const downloadUrl = `${req.protocol}://${req.get('host')}/download/${sessionId}`;
    const qrCodeDataURL = await QRCode.toDataURL(downloadUrl);
    res.json({
      sessionId,
      downloadUrl: `/download/${sessionId}`,
      qrCode: qrCodeDataURL
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});



module.exports = router;
