const express = require('express');
const { v4: uuidv4 } = require('uuid');
const upload = require('../config/multer');
const File   = require('../models/File');
const redis  = require('../utils/redisClient');
const QRCode = require('qrcode');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Generate a short, URL-safe access code
function generateAccessCode(length = 12) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

// Generate a secure owner token (longer for security)
function generateOwnerToken(length = 24) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}
// expects multipart‑form with field "file" and "expireSeconds"
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { encryptedText } = req.body;
    const expireSeconds = parseInt(req.body.expireSeconds, 10) || 3600;
    const expireAt = new Date(Date.now() + expireSeconds*1000);
    const passwordHash = req.body.password
      ? await bcrypt.hash(req.body.password, 10)
      : null;

    const maxDownloads = req.body.maxDownloads
      ? parseInt(req.body.maxDownloads)
      : null;

    // Either file or encrypted text must be provided
    if (!file && !encryptedText) {
      return res.status(400).json({ error: 'No file or text provided' });
    }

    let doc;
    
    if (file) {
      // File upload mode
      doc = await File.create({
        originalName: file.originalname,
        storageName:  file.filename,
        mimeType:     file.mimetype,
        size:         file.size,
        expireAt:     expireAt,
        passwordHash,
        maxDownloads,
        isText: false
      });
    } else {
      // Text mode - store encrypted text
      doc = await File.create({
        originalName: 'encrypted-message.txt',
        storageName:  null, // No file stored
        mimeType:     'text/plain',
        size:         encryptedText.length,
        expireAt:     expireAt,
        passwordHash,
        maxDownloads,
        isText: true,
        encryptedText: encryptedText // Store encrypted text in DB
      });
    }

    // generate internal session ID, public access code, and owner token
    const sessionId = uuidv4();
    const accessCode = generateAccessCode();
    const ownerToken = generateOwnerToken();
    
    // Store sessionId -> fileId mapping (internal use)
    await redis.set(`session:${sessionId}`, doc._id.toString(), 'EX', expireSeconds);
    
    // Store accessCode -> sessionId mapping (public facing - for downloads)
    await redis.set(`access:${accessCode}`, sessionId, 'EX', expireSeconds);
    
    // Store ownerToken -> sessionId mapping (owner only - for session management)
    await redis.set(`owner:${ownerToken}`, sessionId, 'EX', expireSeconds);
    
    // Store session metadata for the frontend (owner only)
    const sessionMetadata = {
      accessCode,
      ownerToken,
      sessionId,
      fileId: doc._id.toString(),
      downloadUrl: `/access/${accessCode}`,
      expiresAt: expireAt.toISOString(),
      createdAt: new Date().toISOString(),
      maxDownloads: maxDownloads,
      fileCount: 1,
      totalSize: file ? file.size : encryptedText.length,
      downloads: 0,
      isText: !!encryptedText
    };
    await redis.set(`metadata:${ownerToken}`, JSON.stringify(sessionMetadata), 'EX', expireSeconds);
    
    // Use frontend URL for QR code and download links
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const downloadUrl = `${frontendUrl}/access/${accessCode}`;
    const qrCodeDataURL = await QRCode.toDataURL(downloadUrl);
    
    console.log('Upload successful:', { accessCode, ownerToken, sessionUrl: `/session/${ownerToken}` });
    
    res.json({
      accessCode,
      ownerToken,
      sessionUrl: `/session/${ownerToken}`
    });
  } catch(err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed', message: err.message });
  }
});

module.exports = router;

