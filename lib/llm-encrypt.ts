import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 16;
const SALT_LEN = 32;

function getEncryptionKey(userId: string): Buffer {
  const secret = process.env.LLM_KEY_ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "default-dev-secret";
  return scryptSync(secret + userId, "jacq-llm-salt", KEY_LEN);
}

export function encryptApiKey(userId: string, plaintext: string): string {
  const key = getEncryptionKey(userId);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, enc]);
  return combined.toString("base64");
}

export function decryptApiKey(userId: string, ciphertext: string): string {
  const key = getEncryptionKey(userId);
  const combined = Buffer.from(ciphertext, "base64");
  const iv = combined.subarray(0, IV_LEN);
  const authTag = combined.subarray(IV_LEN, IV_LEN + 16);
  const enc = combined.subarray(IV_LEN + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(enc) + decipher.final("utf8");
}
