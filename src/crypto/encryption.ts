// Web Crypto API (native in Bunny Edge, Deno, browsers)
const ALGORITHM = "AES-GCM";
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // GCM typically uses 12 bytes
const AUTH_TAG_LENGTH = 16;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

// Derive key using PBKDF2 (Web Crypto standard)
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // NIST recommendation
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(plaintext: string, password: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  return {
    ciphertext: Array.from(new Uint8Array(encrypted))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    iv: Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join(""),
    salt: Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join(""),
  };
}

export async function decrypt(encrypted: EncryptedData, password: string): Promise<string> {
  const salt = new Uint8Array(
    encrypted.salt.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const iv = new Uint8Array(
    encrypted.iv.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const ciphertext = new Uint8Array(
    encrypted.ciphertext.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export function encryptedDataToString(data: EncryptedData): string {
  return JSON.stringify(data);
}

export function stringToEncryptedData(str: string): EncryptedData {
  return JSON.parse(str);
}
