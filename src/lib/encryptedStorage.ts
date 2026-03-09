/**
 * Arcus Encrypted Storage — IndexedDB Vault
 * 
 * Replaces plaintext localStorage with AES-256-GCM encrypted IndexedDB.
 * Every piece of user data is encrypted before touching disk.
 * 
 * DB: "arcus-vault" with object stores for conversations, settings, memory, meta.
 * Migration: one-time import from existing localStorage (arcus_ prefix).
 */

import {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  type EncryptedPayload,
  type DerivedKeys,
} from './crypto';

// ─── Constants ─────────────────────────────────────────────
const DB_NAME = 'arcus-vault';
const DB_VERSION = 1;
const STORES = {
  conversations: 'conversations',
  settings: 'settings',
  memory: 'memory',
  meta: 'meta',
} as const;

const LEGACY_PREFIX = 'arcus_';

// ─── Types ─────────────────────────────────────────────────
interface EncryptedRecord {
  id: string;
  iv: string;
  ciphertext: string;
  version: 1;
  updatedAt: number;
}

interface VaultMeta {
  initialized: boolean;
  migratedFromLocalStorage: boolean;
  createdAt: number;
  lastUnlockedAt: number;
  schemaVersion: number;
}

export interface VaultStatus {
  isOpen: boolean;
  isLocked: boolean;
  conversationCount: number;
  storageEstimate: { usage: number; quota: number } | null;
}

// ─── Database Management ───────────────────────────────────
let db: IDBDatabase | null = null;
let activeKeys: DerivedKeys | null = null;

function getDB(): IDBDatabase {
  if (!db) throw new Error('Vault not initialized. Call initVault() first.');
  return db;
}

function getKeys(): DerivedKeys {
  if (!activeKeys) throw new Error('Vault is locked. Call unlockVault() first.');
  return activeKeys;
}

/**
 * Open the encrypted IndexedDB vault and set up object stores.
 */
export function initVault(keys: DerivedKeys): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available in server context'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Conversations: encrypted chat history
      if (!database.objectStoreNames.contains(STORES.conversations)) {
        const convStore = database.createObjectStore(STORES.conversations, { keyPath: 'id' });
        convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Settings: encrypted user preferences
      if (!database.objectStoreNames.contains(STORES.settings)) {
        database.createObjectStore(STORES.settings, { keyPath: 'id' });
      }

      // Memory: encrypted memory items with salted vectors
      if (!database.objectStoreNames.contains(STORES.memory)) {
        database.createObjectStore(STORES.memory, { keyPath: 'id' });
      }

      // Meta: vault metadata (not encrypted — contains no sensitive data)
      if (!database.objectStoreNames.contains(STORES.meta)) {
        database.createObjectStore(STORES.meta, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      activeKeys = keys;

      // Handle unexpected close
      db.onclose = () => {
        db = null;
        activeKeys = null;
      };

      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to open vault: ${request.error?.message}`));
    };
  });
}

/**
 * Lock the vault — clear keys from memory.
 */
export function lockVault(): void {
  activeKeys = null;
  // DB connection stays open but data is inaccessible without keys
}

/**
 * Unlock the vault with derived keys.
 */
export function unlockVault(keys: DerivedKeys): void {
  activeKeys = keys;
}

/**
 * Close the vault entirely.
 */
export function closeVault(): void {
  activeKeys = null;
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Check if vault is open and unlocked.
 */
export function isVaultReady(): boolean {
  return db !== null && activeKeys !== null;
}

// ─── Generic CRUD Operations ───────────────────────────────

async function putEncrypted<T>(
  storeName: string,
  id: string,
  data: T
): Promise<void> {
  const keys = getKeys();
  const database = getDB();
  const payload = await encryptObject(data, keys.encryptionKey);

  const record: EncryptedRecord = {
    id,
    iv: payload.iv,
    ciphertext: payload.ciphertext,
    version: 1,
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Write failed: ${tx.error?.message}`));
  });
}

async function getEncrypted<T>(
  storeName: string,
  id: string
): Promise<T | null> {
  const keys = getKeys();
  const database = getDB();

  const record = await new Promise<EncryptedRecord | undefined>((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result as EncryptedRecord | undefined);
    request.onerror = () => reject(new Error(`Read failed: ${request.error?.message}`));
  });

  if (!record) return null;

  const payload: EncryptedPayload = {
    iv: record.iv,
    ciphertext: record.ciphertext,
    version: record.version,
  };

  return decryptObject<T>(payload, keys.encryptionKey);
}

async function deleteRecord(storeName: string, id: string): Promise<void> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Delete failed: ${tx.error?.message}`));
  });
}

async function getAllEncrypted<T>(storeName: string): Promise<T[]> {
  const keys = getKeys();
  const database = getDB();

  const records = await new Promise<EncryptedRecord[]>((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as EncryptedRecord[]);
    request.onerror = () => reject(new Error(`ReadAll failed: ${request.error?.message}`));
  });

  const results: T[] = [];
  for (const record of records) {
    try {
      const payload: EncryptedPayload = {
        iv: record.iv,
        ciphertext: record.ciphertext,
        version: record.version,
      };
      const decrypted = await decryptObject<T>(payload, keys.encryptionKey);
      results.push(decrypted);
    } catch {
      // Skip corrupted records — log but don't crash
      console.warn(`Failed to decrypt record ${record.id}, skipping`);
    }
  }

  return results;
}

async function clearStore(storeName: string): Promise<void> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Clear failed: ${tx.error?.message}`));
  });
}

// ─── Conversation Storage ──────────────────────────────────

import type { Conversation } from './types';

export async function saveConversation(conversation: Conversation): Promise<void> {
  await putEncrypted(STORES.conversations, conversation.id, conversation);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  return getEncrypted<Conversation>(STORES.conversations, id);
}

export async function getAllConversations(): Promise<Conversation[]> {
  return getAllEncrypted<Conversation>(STORES.conversations);
}

export async function deleteConversation(id: string): Promise<void> {
  await deleteRecord(STORES.conversations, id);
}

export async function clearAllConversations(): Promise<void> {
  await clearStore(STORES.conversations);
}

// ─── Settings Storage ──────────────────────────────────────

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  await putEncrypted(STORES.settings, key, value);
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const result = await getEncrypted<T>(STORES.settings, key);
  return result ?? fallback;
}

// ─── Memory Storage ────────────────────────────────────────

import type { MemoryItem } from './types';

export async function saveMemoryItem(item: MemoryItem): Promise<void> {
  await putEncrypted(STORES.memory, item.id, item);
}

export async function getAllMemoryItems(): Promise<MemoryItem[]> {
  return getAllEncrypted<MemoryItem>(STORES.memory);
}

export async function deleteMemoryItem(id: string): Promise<void> {
  await deleteRecord(STORES.memory, id);
}

export async function clearAllMemory(): Promise<void> {
  await clearStore(STORES.memory);
}

// ─── Vault Status ──────────────────────────────────────────

export async function getVaultStatus(): Promise<VaultStatus> {
  const isOpen = db !== null;
  const isLocked = activeKeys === null;
  let conversationCount = 0;
  let storageEstimate: VaultStatus['storageEstimate'] = null;

  if (isOpen && !isLocked) {
    try {
      const convs = await new Promise<number>((resolve) => {
        const tx = getDB().transaction(STORES.conversations, 'readonly');
        const request = tx.objectStore(STORES.conversations).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      conversationCount = convs;
    } catch {
      // ignore
    }
  }

  if (navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      storageEstimate = {
        usage: est.usage ?? 0,
        quota: est.quota ?? 0,
      };
    } catch {
      // ignore
    }
  }

  return { isOpen, isLocked, conversationCount, storageEstimate };
}

// ─── Migration from localStorage ───────────────────────────

/**
 * One-time migration: reads existing plaintext localStorage data,
 * encrypts it, stores in IndexedDB, then wipes the plaintext.
 */
export async function migrateFromLocalStorage(): Promise<{
  migrated: number;
  errors: string[];
}> {
  if (typeof window === 'undefined') return { migrated: 0, errors: [] };

  const errors: string[] = [];
  let migrated = 0;

  // Find all arcus_ keys in localStorage
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LEGACY_PREFIX));

  for (const fullKey of keys) {
    const shortKey = fullKey.slice(LEGACY_PREFIX.length);
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null) continue;

      const parsed = JSON.parse(raw);

      // Route to appropriate store based on key pattern
      if (shortKey === 'conversations' && Array.isArray(parsed)) {
        for (const conv of parsed) {
          if (conv?.id) {
            await saveConversation(conv as Conversation);
            migrated++;
          }
        }
      } else if (shortKey === 'memory' && typeof parsed === 'object') {
        if (Array.isArray(parsed.items)) {
          for (const item of parsed.items) {
            if (item?.id) {
              await saveMemoryItem(item as MemoryItem);
              migrated++;
            }
          }
        }
      } else {
        // Generic setting
        await saveSetting(shortKey, parsed);
        migrated++;
      }

      // Wipe plaintext after successful migration
      localStorage.removeItem(fullKey);
    } catch (err) {
      errors.push(`Failed to migrate ${shortKey}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  // Mark migration complete in meta
  const database = getDB();
  await new Promise<void>((resolve) => {
    const tx = database.transaction(STORES.meta, 'readwrite');
    tx.objectStore(STORES.meta).put({
      id: 'vault-meta',
      initialized: true,
      migratedFromLocalStorage: true,
      createdAt: Date.now(),
      lastUnlockedAt: Date.now(),
      schemaVersion: DB_VERSION,
    } satisfies VaultMeta & { id: string });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });

  return { migrated, errors };
}

// ─── Export / Import (Encrypted Backup) ────────────────────

export interface VaultBackup {
  version: 1;
  exportedAt: number;
  conversations: EncryptedRecord[];
  settings: EncryptedRecord[];
  memory: EncryptedRecord[];
}

/**
 * Export the entire vault as an encrypted backup.
 * The backup contains already-encrypted records — it's ciphertext all the way down.
 * User needs their passphrase to restore on another device.
 */
export async function exportVault(): Promise<VaultBackup> {
  const database = getDB();

  const getAll = (store: string): Promise<EncryptedRecord[]> =>
    new Promise((resolve, reject) => {
      const tx = database.transaction(store, 'readonly');
      const request = tx.objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

  const [conversations, settings, memory] = await Promise.all([
    getAll(STORES.conversations),
    getAll(STORES.settings),
    getAll(STORES.memory),
  ]);

  return {
    version: 1,
    exportedAt: Date.now(),
    conversations,
    settings,
    memory,
  };
}

/**
 * Import a vault backup. Overwrites existing data.
 */
export async function importVault(backup: VaultBackup): Promise<void> {
  if (backup.version !== 1) {
    throw new Error(`Unsupported backup version: ${backup.version}`);
  }

  const database = getDB();

  const putAll = (store: string, records: EncryptedRecord[]): Promise<void> =>
    new Promise((resolve, reject) => {
      const tx = database.transaction(store, 'readwrite');
      const objectStore = tx.objectStore(store);
      objectStore.clear(); // wipe before import
      for (const record of records) {
        objectStore.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

  await Promise.all([
    putAll(STORES.conversations, backup.conversations),
    putAll(STORES.settings, backup.settings),
    putAll(STORES.memory, backup.memory),
  ]);
}

/**
 * Completely destroy the vault — delete the entire IndexedDB database.
 * This is irreversible.
 */
export async function destroyVault(): Promise<void> {
  closeVault();

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to destroy vault'));
  });
}
