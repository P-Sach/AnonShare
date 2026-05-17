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
    // Prefer metadata to avoid Redis key scans
    const metadataJson = await redis.get(`metadata:${ownerToken}`);
    const metadata = metadataJson ? JSON.parse(metadataJson) : null;

    // Resolve owner token to session ID (fallback to metadata)
    const sessionId = (await redis.get(`owner:${ownerToken}`)) || metadata?.sessionId;
    if (!sessionId) {
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    // Get file ID from session (fallback to metadata)
    const fileId = (await redis.get(`session:${sessionId}`)) || metadata?.fileId;
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

    // Delete the access code directly if known
    const accessCode = metadata?.accessCode;
    if (accessCode) {
      await redis.del(`access:${accessCode}`);
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
