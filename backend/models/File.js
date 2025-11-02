const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName:  { type: String, required: true },
  storageName:   { type: String, required: false }, // Not required for text mode
  mimeType:      { type: String, required: true },
  size:          { type: Number, required: true },
  createdAt:     { type: Date,   default: Date.now },
  // TTL index: document will be removed when `expireAt` is reached
  expireAt:      { type: Date,   index: { expires: 0 } },
  passwordHash:  { type: String, default: null },
  maxDownloads:  { type: Number, default: null },
  downloadCount: { type: Number, default: 0 },
  isText:        { type: Boolean, default: false },
  encryptedText: { type: String, default: null } // Store encrypted text for text mode
});

module.exports = mongoose.model('File', fileSchema);
