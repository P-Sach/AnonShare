const express = require('express');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const redis = require('../utils/redisClient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { sessionId } = req.body;

  try {
    const fileId = await redis.get(sessionId);
    if (!fileId) return res.status(404).json({ error: 'Session not found' });

    const fileDoc = await File.findById(fileId);
    if (fileDoc) {
      const filePath = path.join(__dirname, '../uploads', fileDoc.storageName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await fileDoc.deleteOne();
    }

    await redis.del(sessionId);

    res.json({ success: true });
  } catch (err) {
    console.error('[EndSession]', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

module.exports = router;
