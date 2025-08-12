const crypto = require("crypto");

// simple AES-256-CBC encryption helper (synchronous)
function encryptVault(data, password) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, 'legacy_salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptVault(encryptedData, password) {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const key = crypto.scryptSync(password, 'legacy_salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

module.exports = { encryptVault, decryptVault };
