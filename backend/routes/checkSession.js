const express = require('express');
const redis = require('../utils/redisClient');
const File = require('../models/File');

const router = express.Router();

router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const fileId = await redis.get(sessionId);
    if (!fileId) return res.status(404).json({ valid: false });

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) return res.status(404).json({ valid: false });

    res.json({ valid: true });
  } catch (err) {
    console.error('[CheckSession]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
