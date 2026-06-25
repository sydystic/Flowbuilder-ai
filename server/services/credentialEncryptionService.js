const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const keyStr = process.env.ENCRYPTION_KEY;
if (!keyStr) {
  console.error("FATAL ERROR: ENCRYPTION_KEY environment variable is missing.");
  process.exit(1);
}

let keyBuf;
if (keyStr.length === 64 && /^[0-9a-fA-F]+$/.test(keyStr)) {
  keyBuf = Buffer.from(keyStr, "hex");
} else {
  // Try Base64 parsing (Base64 length for 32-bytes is 44 characters)
  const base64Buf = Buffer.from(keyStr, "base64");
  if (base64Buf.length === 32 && keyStr.includes("=")) {
    keyBuf = base64Buf;
  } else {
    // Fallback to UTF-8
    const utf8Buf = Buffer.from(keyStr, "utf8");
    if (utf8Buf.length === 32) {
      keyBuf = utf8Buf;
    } else if (base64Buf.length === 32) {
      keyBuf = base64Buf;
    }
  }
}

if (!keyBuf || keyBuf.length !== 32) {
  console.error("FATAL ERROR: ENCRYPTION_KEY must resolve to exactly 32 bytes (256 bits).");
  console.error("It can be a 32-character ASCII string, a 64-character hex string, or a 44-character base64-encoded string.");
  console.error("Generate a secure base64 key with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"");
  process.exit(1);
}

const ALGORITHM = "aes-256-gcm";

const credentialEncryptionService = {
  /**
   * Encrypts plaintext config data to AES-256-GCM ciphertext
   * @param {object|string} configData
   * @returns {string} iv:ciphertext:authTag formatted string
   */
  encrypt(configData) {
    const plaintext = typeof configData === "string" ? configData : JSON.stringify(configData);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuf, iv);
    
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${encrypted}:${authTag}`;
  },

  /**
   * Decrypts AES-256-GCM ciphertext back to plaintext
   * @param {string} ciphertext iv:ciphertext:authTag formatted string
   * @returns {object} parsed JSON configuration
   */
  decrypt(ciphertext) {
    if (!ciphertext) {
      throw new Error("No ciphertext provided for decryption");
    }

    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted credential format. Must be iv:ciphertext:authTag");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  }
};

module.exports = credentialEncryptionService;
