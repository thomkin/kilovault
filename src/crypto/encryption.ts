import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ITERATIONS = 32768; // NIST recommendation for PBKDF2 alternative

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  salt: string;
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 32, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

export function encrypt(plaintext: string, password: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    salt: salt.toString("hex"),
  };
}

export function decrypt(encrypted: EncryptedData, password: string): string {
  const salt = Buffer.from(encrypted.salt, "hex");
  const key = deriveKey(password, salt);
  const iv = Buffer.from(encrypted.iv, "hex");
  const authTag = Buffer.from(encrypted.authTag, "hex");
  const ciphertext = Buffer.from(encrypted.ciphertext, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

export function encryptedDataToString(data: EncryptedData): string {
  return JSON.stringify(data);
}

export function stringToEncryptedData(str: string): EncryptedData {
  return JSON.parse(str);
}
