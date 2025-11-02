const express = require('express');
const bcrypt = require('bcrypt');
const File = require('../models/File');
const redis = require('../utils/redisClient');

const router = express.Router();

// This route now accepts either sessionId (internal) or accessCode (public)
router.get('/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const { password } = req.query;

  try {
    let fileId;
    
    // First try as access code
    const sessionId = await redis.get(`access:${identifier}`);
    if (sessionId) {
      fileId = await redis.get(`session:${sessionId}`);
    } else {
      // Fallback: try as direct session ID (for backward compatibility)
      fileId = await redis.get(`session:${identifier}`);
    }
    
    if (!fileId) return res.status(404).json({ error: 'Session expired or not found' });

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: 'File metadata not found' });

    // If file is password-protected, verify password before revealing file details
    if (file.passwordHash) {
      // If no password provided, only return that it's password-protected
      if (!password) {
        return res.json({
          passwordProtected: true,
          expiresAt: file.expireAt,
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, file.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Check if download limit has been reached
    const downloadLimitReached = file.maxDownloads !== null && file.downloadCount >= file.maxDownloads;

    // Only return full file details if:
    // 1. File is not password-protected, OR
    // 2. Password was provided and verified
    res.json({
      name: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      expiresAt: file.expireAt,
      passwordProtected: !!file.passwordHash,
      downloadCount: file.downloadCount,
      maxDownloads: file.maxDownloads,
      downloadLimitReached: downloadLimitReached,
      isText: file.isText || false
    });
  } catch (err) {
    console.error('[SessionInfo]', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
