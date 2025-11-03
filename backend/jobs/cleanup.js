const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const File = require('../models/File');
const getUploadDir = require('../utils/uploadPath');

async function cleanupFiles() {
  try {
    const UPLOAD_DIR = getUploadDir();
    
    // Skip cleanup on serverless (files in /tmp are auto-cleaned)
    if (process.env.VERCEL) {
      console.log('[Cleanup] Skipping cleanup on serverless environment');
      return;
    }
    
    const allFiles = fs.readdirSync(UPLOAD_DIR);
    const fileDocs = await File.find({}, 'storageName'); // only live metadata
    const liveFiles = new Set(fileDocs.map(doc => doc.storageName));

    // check for orphaned files
    const UPLOAD_DIR = getUploadDir();
    for (const file of allFiles) {
      if (!liveFiles.has(file)) {
        const filePath = path.join(UPLOAD_DIR, file);
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Deleted orphaned file: ${file}`);
      }
    }
  } catch (err) {
    console.error('[Cleanup] Error during cleanup:', err);
  }
}

module.exports = cleanupFiles;
