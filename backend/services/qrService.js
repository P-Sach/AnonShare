const QRCode = require("qrcode");

const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    throw new Error("Failed to generate QR code");
  }
};

module.exports = generateQRCode;
