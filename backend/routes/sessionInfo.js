const express = require('express');
const File = require('../models/File');
const redis = require('../utils/redisClient');

const router = express.Router();

router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const fileId = await redis.get(sessionId);
    if (!fileId) return res.status(404).json({ error: 'Session expired or not found' });

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: 'File metadata not found' });

    res.json({
      name: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      expiresAt: file.expireAt,
      passwordProtected: !!file.passwordHash,
    });
  } catch (err) {
    console.error('[SessionInfo]', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
