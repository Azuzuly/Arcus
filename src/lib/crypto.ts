/**
 * Arcus Crypto Module — Venice.ai-Inspired Client-Side Encryption
 * 
 * Zero-dependency encryption using the Web Crypto API.
 * All operations run client-side — the server never sees plaintext data.
 * 
 * Key Derivation: passphrase → PBKDF2 (100K iterations) → AES-256-GCM master key
 * Encryption: AES-256-GCM with random 96-bit IV per operation
 * Key Wrapping: AES-KW for secure session persistence
 */

// ─── Constants ─────────────────────────────────────────────
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 32;
const IV_BYTES = 12; // 96-bit IV for AES-GCM
const KEY_LENGTH = 256;
const HKDF_INFO_ENCRYPT = new TextEncoder().encode('arcus-encrypt');
const HKDF_INFO_AUTH = new TextEncoder().encode('arcus-auth');
const HKDF_INFO_SALT = new TextEncoder().encode('arcus-memoria-salt');

// ─── Types ─────────────────────────────────────────────────
export interface EncryptedPayload {
  iv: string;         // base64-encoded 96-bit IV
  ciphertext: string; // base64-encoded encrypted data
  version: 1;         // schema version for future migration
}

export interface DerivedKeys {
  masterKey: CryptoKey;       // Raw PBKDF2-derived key (used for HKDF)
  encryptionKey: CryptoKey;   // AES-256-GCM for data encryption
  authKey: CryptoKey;         // HMAC-SHA256 for data authentication
  memorySalt: Uint8Array;     // 32-byte salt for vector memory (Memoria)
}

export interface WrappedKeyBundle {
  wrappedKey: string;  // base64 AES-KW wrapped master key material
  salt: string;        // base64 PBKDF2 salt (needed to re-derive)
  iterations: number;
  version: 1;
}

// ─── Helpers ───────────────────────────────────────────────
const subtle = (): SubtleCrypto => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API not available. Use HTTPS or a modern browser.');
  }
  return window.crypto.subtle;
};

function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ─── Key Derivation ────────────────────────────────────────

/**
 * Generate a cryptographically random salt for PBKDF2.
 */
export function generateSalt(): Uint8Array {
  return generateRandomBytes(SALT_BYTES);
}

/**
 * Derive a master key from a user passphrase using PBKDF2.
 * This is the root of all encryption — passphrase lost = data lost.
 */
export async function deriveMasterKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await subtle().importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return subtle().deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HKDF', length: KEY_LENGTH },
    false, // not extractable by default
    ['deriveBits', 'deriveKey']
  );
}

/**
 * Derive all sub-keys from the master key using HKDF.
 * Separates encryption, authentication, and memory salt concerns.
 */
export async function deriveAllKeys(masterKey: CryptoKey): Promise<DerivedKeys> {
  const encryptionKey = await subtle().deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0) as BufferSource, info: HKDF_INFO_ENCRYPT as BufferSource },
    masterKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  const authKey = await subtle().deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0) as BufferSource, info: HKDF_INFO_AUTH as BufferSource },
    masterKey,
    { name: 'HMAC', hash: 'SHA-256', length: KEY_LENGTH },
    false,
    ['sign', 'verify']
  );

  const memorySaltBits = await subtle().deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0) as BufferSource, info: HKDF_INFO_SALT as BufferSource },
    masterKey,
    256
  );

  return {
    masterKey,
    encryptionKey,
    authKey,
    memorySalt: new Uint8Array(memorySaltBits),
  };
}

// ─── Encryption / Decryption ───────────────────────────────

/**
 * Encrypt arbitrary data with AES-256-GCM.
 * Returns base64-encoded IV + ciphertext for storage.
 */
export async function encrypt(
  data: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const iv = generateRandomBytes(IV_BYTES);

  const ciphertext = await subtle().encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoder.encode(data)
  );

  return {
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    version: 1,
  };
}

/**
 * Decrypt an AES-256-GCM encrypted payload.
 * Throws if key is wrong or data is tampered (GCM auth tag verification).
 */
export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);

  const decrypted = await subtle().decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt a JavaScript object (serialized to JSON).
 */
export async function encryptObject<T>(
  obj: T,
  key: CryptoKey
): Promise<EncryptedPayload> {
  return encrypt(JSON.stringify(obj), key);
}

/**
 * Decrypt and parse a JavaScript object.
 */
export async function decryptObject<T>(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<T> {
  const json = await decrypt(payload, key);
  return JSON.parse(json) as T;
}

// ─── Key Wrapping (Session Persistence) ────────────────────

/**
 * Derive a wrapping key from the passphrase for session persistence.
 * This lets us store the wrapped master key in sessionStorage so
 * the user doesn't need to re-enter their passphrase on every page load.
 */
export async function deriveMasterKeyExtractable(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await subtle().importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive raw bits, then import as extractable HKDF key
  const rawBits = await subtle().deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  return subtle().importKey(
    'raw',
    rawBits,
    'HKDF',
    false, // The HKDF key itself doesn't need to be extractable
    ['deriveBits', 'deriveKey']
  );
}

/**
 * Wrap the master key for safe storage in sessionStorage.
 * Uses a session-specific wrapping key derived from a random session secret.
 */
export async function wrapMasterKey(
  masterKeyBits: ArrayBuffer,
  sessionSecret: Uint8Array
): Promise<string> {
  const wrappingKey = await subtle().importKey(
    'raw',
    sessionSecret as BufferSource,
    'AES-KW',
    false,
    ['wrapKey']
  );

  const keyToWrap = await subtle().importKey(
    'raw',
    masterKeyBits,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true, // must be extractable to wrap
    ['encrypt', 'decrypt']
  );

  const wrapped = await subtle().wrapKey('raw', keyToWrap, wrappingKey, 'AES-KW');
  return toBase64(wrapped);
}

/**
 * Unwrap a previously wrapped master key from sessionStorage.
 */
export async function unwrapMasterKey(
  wrappedBase64: string,
  sessionSecret: Uint8Array
): Promise<CryptoKey> {
  const wrappingKey = await subtle().importKey(
    'raw',
    sessionSecret as BufferSource,
    'AES-KW',
    false,
    ['unwrapKey']
  );

  return subtle().unwrapKey(
    'raw',
    fromBase64(wrappedBase64) as BufferSource,
    wrappingKey,
    'AES-KW',
    { name: 'HKDF', length: KEY_LENGTH },
    false,
    ['deriveBits', 'deriveKey']
  );
}

// ─── Passphrase Strength ───────────────────────────────────

export interface PassphraseStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=terrible, 4=strong
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Excellent';
  feedback: string[];
}

/**
 * Evaluate passphrase strength with actionable feedback.
 */
export function evaluatePassphrase(passphrase: string): PassphraseStrength {
  const feedback: string[] = [];
  let score = 0;

  if (passphrase.length >= 8) score++;
  else feedback.push('Use at least 8 characters');

  if (passphrase.length >= 12) score++;
  else if (passphrase.length >= 8) feedback.push('12+ characters recommended');

  if (/[a-z]/.test(passphrase) && /[A-Z]/.test(passphrase)) score++;
  else feedback.push('Mix uppercase and lowercase letters');

  if (/\d/.test(passphrase) && /[^a-zA-Z0-9]/.test(passphrase)) score++;
  else feedback.push('Add numbers and special characters');

  const labels: PassphraseStrength['label'][] = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  return { score: score as PassphraseStrength['score'], label: labels[score], feedback };
}

// ─── Utility: Secure Memory Wipe ───────────────────────────

/**
 * Attempt to zero out sensitive data in memory.
 * Note: JavaScript GC makes this best-effort, not guaranteed.
 */
export function secureWipe(buffer: Uint8Array): void {
  crypto.getRandomValues(buffer); // overwrite with random
  buffer.fill(0);                  // then zero
}

/**
 * Generate a fingerprint of the encryption key for UI display.
 * Shows last 8 chars of a SHA-256 hash so users can verify they're
 * using the same key across devices.
 */
export async function keyFingerprint(key: CryptoKey): Promise<string> {
  // Export the auth key's raw bits for hashing
  const exported = await subtle().exportKey('raw', key).catch(() => null);
  if (!exported) return 'locked';

  const hash = await subtle().digest('SHA-256', exported);
  const hex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hex.slice(-8).toUpperCase();
}
