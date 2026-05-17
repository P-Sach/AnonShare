const express = require('express');
const redis = require('../utils/redisClient');
const QRCode = require('qrcode');
const File = require('../models/File');

const router = express.Router();

// Get full session data by OWNER TOKEN (not access code)
// This ensures only the person who created the share can access session management
router.get('/:ownerToken', async (req, res) => {
  const { ownerToken } = req.params;

  const toExpiryLabel = (seconds) => {
    if (!seconds) return null;
    if (seconds <= 3600) return '1 hour';
    if (seconds <= 86400) return '24 hours';
    if (seconds <= 259200) return '3 days';
    if (seconds <= 604800) return '7 days';
    return '30 days';
  };

  try {
    // Retrieve session metadata from Redis using owner token
    const metadataJson = await redis.get(`metadata:${ownerToken}`);
    
    if (!metadataJson) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const metadata = JSON.parse(metadataJson);
    
    // Verify the owner token in metadata matches (extra security check)
    if (metadata.ownerToken !== ownerToken) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Fetch live download count from database
    let currentDownloadCount = 0;
    let maxDownloads = null;
    let fileName = null;
    let mimeType = null;
    let fileSize = null;
    let passwordProtected = false;
    if (metadata.fileId) {
      try {
        const fileDoc = await File.findById(metadata.fileId);
        if (fileDoc) {
          currentDownloadCount = fileDoc.downloadCount || 0;
          maxDownloads = fileDoc.maxDownloads;
          fileName = fileDoc.originalName;
          mimeType = fileDoc.mimeType;
          fileSize = fileDoc.size;
          passwordProtected = !!fileDoc.passwordHash;
        }
      } catch (dbErr) {
        console.error('[SessionData] Error fetching file:', dbErr);
        // Continue without download count if database fetch fails
      }
    }
    
    // Generate QR code for the download URL using frontend URL
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const accessCode = metadata.accessCode || metadata.downloadUrl.split('/').pop();
    const downloadUrl = `${frontendUrl}/download/${accessCode}`;
    const qrCodeDataURL = await QRCode.toDataURL(downloadUrl);
    
    // Return complete session data with live download count
    res.json({
      ...metadata,
      downloadUrl: `/download/${accessCode}`,
      qrCode: qrCodeDataURL,
      downloads: currentDownloadCount,
      maxDownloads: maxDownloads,
      expiryLabel: toExpiryLabel(metadata.expireSeconds),
      burnAfterRead: metadata.burnAfterRead || false,
      name: fileName,
      mimeType: mimeType,
      size: fileSize,
      passwordProtected: passwordProtected
    });
  } catch (err) {
    console.error('[SessionData]', err);
    res.status(500).json({ error: 'Failed to retrieve session data' });
  }
});

module.exports = router;
