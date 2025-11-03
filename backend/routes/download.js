const express = require('express');
const path    = require('path');
const fs      = require('fs');
const bcrypt  = require('bcrypt');
const File    = require('../models/File');
const redis   = require('../utils/redisClient');
const getUploadDir = require('../utils/uploadPath');

const router = express.Router();

// GET /download/:accessCode
router.get('/:accessCode', async (req, res) => {
  const { accessCode } = req.params;

  try {
    // 1. Resolve access code to session ID
    const sessionId = await redis.get(`access:${accessCode}`);
    if (!sessionId) {
      return res.status(404).json({ error: 'Session expired or not found' });
    }

    // 2. Look up file ID in Redis using session ID
    const fileId = await redis.get(`session:${sessionId}`);
    if (!fileId) {
      return res.status(404).json({ error: 'Session expired or not found' });
    }

    // 3. Fetch metadata from MongoDB
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

    // Check if this is text mode
    if (fileDoc.isText) {
      // Text mode - return encrypted text as JSON
      fileDoc.downloadCount += 1;
      await fileDoc.save();
      
      return res.json({
        encryptedText: fileDoc.encryptedText,
        hasPassword: !!fileDoc.passwordHash
      });
    }

    // 4. Build filesystem path (file mode)
    const filePath = path.join(getUploadDir(), fileDoc.storageName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    

    // 5. Stream file to client
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
