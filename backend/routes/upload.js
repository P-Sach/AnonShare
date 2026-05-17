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
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('[Upload] Multer error:', err);
      
      // Check if it's a file size error
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          error: 'File too large', 
          message: 'Maximum file size is 4MB on Vercel. Please use a smaller file or try LocShare for larger files on the same network.' 
        });
      }
      
      return res.status(400).json({ 
        error: 'File upload error', 
        message: err.message 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('[Upload] Request received:', {
      hasFile: !!req.file,
      hasEncryptedText: !!req.body.encryptedText,
      expireSeconds: req.body.expireSeconds
    });

    const { file } = req;
    const { encryptedText } = req.body;
    const expireSeconds = parseInt(req.body.expireSeconds, 10) || 3600;
    const isText = req.body.isText === 'true' || !!encryptedText;
    const burnAfterRead = req.body.burnAfterRead === 'true';

    if (!expireSeconds || expireSeconds < 60 || expireSeconds > 2592000) {
      return res.status(400).json({
        error: 'Invalid expiry',
        message: 'Expiry must be between 60 seconds and 30 days.'
      });
    }
    const expireAt = new Date(Date.now() + expireSeconds*1000);
    const passwordHash = req.body.password
      ? await bcrypt.hash(req.body.password, 10)
      : null;

    const maxDownloads = req.body.maxDownloads
      ? parseInt(req.body.maxDownloads)
      : null;

    if (isText && !encryptedText) {
      console.log('[Upload] Error: No text provided');
      return res.status(400).json({ error: 'No text provided' });
    }

    if (!isText && !file) {
      console.log('[Upload] Error: No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    let doc;
    
    if (file && !isText) {
      // File upload mode
      console.log('[Upload] Creating file document in MongoDB');
      doc = await File.create({
        originalName: file.originalname,
        storageName:  file.filename,
        mimeType:     file.mimetype,
        size:         file.size,
        expireAt:     expireAt,
        passwordHash,
        maxDownloads,
        isText: false,
        burnAfterRead: false
      });
      console.log('[Upload] File document created:', doc._id);
    } else {
      // Text mode - store encrypted text
      console.log('[Upload] Creating text document in MongoDB');
      doc = await File.create({
        originalName: req.body.originalName || 'encrypted-message.txt',
        storageName:  null, // No file stored
        mimeType:     'text/plain',
        size:         encryptedText.length,
        expireAt:     expireAt,
        passwordHash,
        maxDownloads,
        isText: true,
        encryptedText: encryptedText, // Store encrypted text in DB
        burnAfterRead: burnAfterRead
      });
      console.log('[Upload] Text document created:', doc._id);
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
      downloadUrl: `/download/${accessCode}`,
      expiresAt: expireAt.toISOString(),
      expireSeconds: expireSeconds,
      createdAt: new Date().toISOString(),
      maxDownloads: maxDownloads,
      fileCount: 1,
      totalSize: file ? file.size : encryptedText.length,
      downloads: 0,
      isText: !!encryptedText,
      burnAfterRead: burnAfterRead
    };
    await redis.set(`metadata:${ownerToken}`, JSON.stringify(sessionMetadata), 'EX', expireSeconds);
    
    // Use frontend URL for QR code and download links
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const downloadUrl = `${frontendUrl}/download/${accessCode}`;
    const qrCodeDataURL = await QRCode.toDataURL(downloadUrl);
    
    console.log('Upload successful:', { accessCode, ownerToken, sessionUrl: `/session/${ownerToken}` });
    
    res.json({
      accessCode,
      ownerToken,
      sessionUrl: `/session/${ownerToken}`
    });
  } catch(err) {
    console.error('[Upload] Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });

    if (req.file?.path) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error('[Upload] Failed to cleanup file:', cleanupErr);
      }
    }
    
    // Send detailed error for debugging
    res.status(500).json({ 
      error: 'Upload failed', 
      message: err.message,
      details: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});

module.exports = router;

