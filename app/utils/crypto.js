import CryptoJS from 'crypto-js';

// Simple encryption/decryption using crypto-js (works in all contexts)
export async function encryptText(text, password) {
  if (!password) return text; // No encryption if no password
  
  try {
    // CryptoJS.AES.encrypt returns a WordArray, convert to string
    const encrypted = CryptoJS.AES.encrypt(text, password).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt text');
  }
}

export async function decryptText(encryptedText, password) {
  if (!password) return encryptedText; // No decryption if no password
  
  try {
    // Decrypt using CryptoJS
    const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!result) {
      throw new Error('Decryption produced empty result. This could mean:\n1. Wrong password\n2. Text was encrypted with a different method\n3. Corrupted data\n\nPlease create a new share and try again.');
    }
    
    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid password or corrupted data. If you just updated the app, please create a new share.');
  }
}
