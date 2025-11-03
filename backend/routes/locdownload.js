const express = require('express');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const bcrypt = require('bcrypt');
const getUploadDir = require('../utils/uploadPath');

const router = express.Router();

router.get('/:accessKey', async (req, res) => {
  try {
    const { accessKey } = req.params;
    const { password } = req.query;

    const decoded = Buffer.from(accessKey, 'base64').toString();
    const { fileId, password: passRequired } = JSON.parse(decoded);

    if (passRequired && password !== passRequired) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(getUploadDir(), fileDoc.storageName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.originalName}"`);
    res.setHeader('Content-Type', fileDoc.mimeType);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[LocDownload]', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
