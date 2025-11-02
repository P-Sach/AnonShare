const express = require('express');
const redis = require('../utils/redisClient');
const File = require('../models/File');

const router = express.Router();

// This route now accepts either sessionId (internal) or accessCode (public)
// We'll check both patterns to maintain backward compatibility
router.get('/:identifier', async (req, res) => {
  const { identifier } = req.params;

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
    
    if (!fileId) return res.status(404).json({ valid: false });

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) return res.status(404).json({ valid: false });

    res.json({ valid: true, expiresAt: fileDoc.expireAt, downloads: fileDoc.downloadCount });
  } catch (err) {
    console.error('[CheckSession]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
