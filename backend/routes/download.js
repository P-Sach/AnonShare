const express = require('express');
const path    = require('path');
const fs      = require('fs');
const bcrypt  = require('bcrypt');
const File    = require('../models/File');
const redis   = require('../utils/redisClient');

const router = express.Router();

// GET /download/:sessionId
router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    // 1. Look up file ID in Redis
    const fileId = await redis.get(sessionId);
    if (!fileId) {
      return res.status(404).json({ error: 'Session expired or not found' });
    }

    // 2. Fetch metadata from MongoDB
    const fileDoc = await File.findById(fileId);
    if (!fileDoc) {
      return res.status(404).json({ error: 'File metadata not found' });
    }

    if (fileDoc.passwordHash) {
      if (!req.query.password || !(await bcrypt.compare(req.query.password, fileDoc.passwordHash))) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    if (fileDoc.maxDownloads !== null && fileDoc.downloadCount >= fileDoc.maxDownloads) {
      return res.status(403).json({ error: 'Download limit reached' });
    }

    // 3. Build filesystem path
    const filePath = path.join(__dirname, '../uploads', fileDoc.storageName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    

    // 4. Stream file to client
    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.originalName}"`);
    res.setHeader('Content-Type', fileDoc.mimeType);
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    fileDoc.downloadCount += 1;
    await fileDoc.save();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
