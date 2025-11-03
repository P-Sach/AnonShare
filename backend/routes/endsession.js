const express = require('express');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const redis = require('../utils/redisClient');
const getUploadDir = require('../utils/uploadPath');

const router = express.Router();

router.post('/', async (req, res) => {
  const { ownerToken } = req.body;

  try {
    // Resolve owner token to session ID
    const sessionId = await redis.get(`owner:${ownerToken}`);
    if (!sessionId) {
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }
    
    // Get file ID from session
    const fileId = await redis.get(`session:${sessionId}`);
    if (!fileId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete the file from disk and database
    const fileDoc = await File.findById(fileId);
    if (fileDoc) {
      // Only delete physical file if it exists (file mode, not text mode)
      if (fileDoc.storageName) {
        const filePath = path.join(getUploadDir(), fileDoc.storageName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // Delete the database record (works for both file and text modes)
      await fileDoc.deleteOne();
    }

    // Find and delete the access code
    const keys = await redis.keys(`access:*`);
    let accessCode = null;
    for (const key of keys) {
      const sid = await redis.get(key);
      if (sid === sessionId) {
        accessCode = key.replace('access:', '');
        await redis.del(key);
        break;
      }
    }

    // Clean up all Redis keys
    await redis.del(`session:${sessionId}`);
    await redis.del(`owner:${ownerToken}`);
    await redis.del(`metadata:${ownerToken}`);

    res.json({ success: true });
  } catch (err) {
    console.error('[EndSession]', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

module.exports = router;
