const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const keyStr = process.env.ENCRYPTION_KEY;
if (!keyStr) {
  console.error("FATAL ERROR: ENCRYPTION_KEY environment variable is missing.");
  process.exit(1);
}

const keyBuf = Buffer.from(keyStr, "utf8");
if (keyBuf.length !== 32) {
  console.error(`FATAL ERROR: ENCRYPTION_KEY must be exactly 32 bytes. Current length is ${keyBuf.length} bytes.`);
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
