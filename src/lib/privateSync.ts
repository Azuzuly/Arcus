/**
 * Arcus Private Sync — End-to-End Encrypted Remote Sync
 * 
 * Replaces remoteSync.ts with E2E encrypted sync.
 * InsForge only ever sees encrypted blobs — zero plaintext.
 * 
 * Protocol:
 *   1. Client encrypts conversation with user's encryption key
 *   2. Encrypted blob uploaded to InsForge (server sees only ciphertext)
 *   3. On new device: user enters passphrase → derives key → decrypts
 *   4. Conflict resolution: last-write-wins based on updatedAt timestamps
 */

import type { Conversation, ChatSettings, SelectedModel } from './types';
import { insforge } from './insforge';
import { encryptObject, decryptObject, type EncryptedPayload, type DerivedKeys } from './crypto';

// ─── Types ─────────────────────────────────────────────────

interface EncryptedConversationRow {
  id: string;
  user_id: string;
  encrypted_blob: string;   // JSON-stringified EncryptedPayload
  blob_version: number;     // Encryption schema version
  updated_at: string;       // ISO timestamp for conflict resolution
  created_at: string;
}

interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
}

interface SyncStatus {
  lastSyncAt: number | null;
  pendingChanges: number;
  issyncing: boolean;
}

// ─── Error Handling ────────────────────────────────────────

function isMissingSyncSchemaError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';
  return /relation .* does not exist|table .* does not exist|encrypted_conversations/i.test(message);
}

// ─── Sync State ────────────────────────────────────────────

let syncInProgress = false;
let lastSyncTimestamp: number | null = null;

// ─── Upload: Encrypt & Push ────────────────────────────────

/**
 * Upload conversations to InsForge as encrypted blobs.
 * The server never sees any plaintext conversation data.
 */
export async function pushEncryptedConversations(
  userId: string,
  conversations: Conversation[],
  keys: DerivedKeys
): Promise<{ uploaded: number; errors: string[] }> {
  if (conversations.length === 0) return { uploaded: 0, errors: [] };

  const errors: string[] = [];
  let uploaded = 0;

  // Process in batches to avoid overwhelming the connection
  const BATCH_SIZE = 10;

  for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
    const batch = conversations.slice(i, i + BATCH_SIZE);

    const rows: EncryptedConversationRow[] = [];

    for (const conv of batch) {
      try {
        // Encrypt the entire conversation object
        const encrypted = await encryptObject(conv, keys.encryptionKey);

        rows.push({
          id: conv.id,
          user_id: userId,
          encrypted_blob: JSON.stringify(encrypted),
          blob_version: 1,
          updated_at: new Date(conv.updatedAt).toISOString(),
          created_at: new Date(conv.createdAt).toISOString(),
        });
      } catch (err) {
        errors.push(
          `Encrypt failed for ${conv.id}: ${err instanceof Error ? err.message : 'unknown'}`
        );
      }
    }

    if (rows.length === 0) continue;

    try {
      const { error: upsertError } = await insforge.database
        .from('encrypted_conversations')
        .upsert(rows, { onConflict: 'id' });

      if (upsertError) {
        if (isMissingSyncSchemaError(upsertError)) {
          errors.push('Encrypted sync table not found. Run migration first.');
          return { uploaded, errors };
        }
        throw upsertError;
      }

      uploaded += rows.length;
    } catch (err) {
      errors.push(
        `Upload batch failed: ${err instanceof Error ? err.message : 'unknown'}`
      );
    }
  }

  return { uploaded, errors };
}

// ─── Download: Pull & Decrypt ──────────────────────────────

/**
 * Fetch encrypted conversations from InsForge and decrypt them locally.
 */
export async function pullEncryptedConversations(
  userId: string,
  keys: DerivedKeys,
  defaultSettings: ChatSettings
): Promise<{ conversations: Conversation[]; errors: string[] }> {
  const errors: string[] = [];

  try {
    const { data: rows, error } = await insforge.database
      .from('encrypted_conversations')
      .select('id,user_id,encrypted_blob,blob_version,updated_at,created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      if (isMissingSyncSchemaError(error)) {
        return { conversations: [], errors: [] };
      }
      throw error;
    }

    const encryptedRows = (rows || []) as EncryptedConversationRow[];
    if (encryptedRows.length === 0) return { conversations: [], errors: [] };

    const conversations: Conversation[] = [];

    for (const row of encryptedRows) {
      try {
        const payload: EncryptedPayload = JSON.parse(row.encrypted_blob);
        const decrypted = await decryptObject<Conversation>(payload, keys.encryptionKey);
        conversations.push(decrypted);
      } catch (err) {
        // Decryption failure = wrong key or corrupted data
        errors.push(
          `Decrypt failed for ${row.id}: ${err instanceof Error ? err.message : 'unknown'}`
        );
      }
    }

    return { conversations, errors };
  } catch (err) {
    return {
      conversations: [],
      errors: [`Fetch failed: ${err instanceof Error ? err.message : 'unknown'}`],
    };
  }
}

// ─── Full Sync: Bidirectional Merge ────────────────────────

/**
 * Perform a full bidirectional sync:
 *   1. Pull remote encrypted conversations
 *   2. Merge with local conversations (last-write-wins)
 *   3. Push any local-only or newer conversations back
 *   4. Return the merged set
 */
export async function fullSync(
  userId: string,
  localConversations: Conversation[],
  keys: DerivedKeys,
  defaultSettings: ChatSettings
): Promise<{ merged: Conversation[]; result: SyncResult }> {
  if (syncInProgress) {
    return {
      merged: localConversations,
      result: { uploaded: 0, downloaded: 0, conflicts: 0, errors: ['Sync already in progress'] },
    };
  }

  syncInProgress = true;
  const result: SyncResult = { uploaded: 0, downloaded: 0, conflicts: 0, errors: [] };

  try {
    // Step 1: Pull remote
    const { conversations: remoteConvs, errors: pullErrors } =
      await pullEncryptedConversations(userId, keys, defaultSettings);
    result.errors.push(...pullErrors);
    result.downloaded = remoteConvs.length;

    // Step 2: Merge (last-write-wins)
    const localMap = new Map(localConversations.map(c => [c.id, c]));
    const remoteMap = new Map(remoteConvs.map(c => [c.id, c]));
    const merged = new Map<string, Conversation>();

    // Process all remote conversations
    for (const [id, remote] of remoteMap) {
      const local = localMap.get(id);
      if (!local) {
        // Remote-only: take remote
        merged.set(id, remote);
      } else if (remote.updatedAt > local.updatedAt) {
        // Remote is newer: take remote
        merged.set(id, remote);
        result.conflicts++;
      } else {
        // Local is newer or same: take local
        merged.set(id, local);
        if (remote.updatedAt < local.updatedAt) {
          result.conflicts++;
        }
      }
    }

    // Add local-only conversations
    for (const [id, local] of localMap) {
      if (!merged.has(id)) {
        merged.set(id, local);
      }
    }

    const mergedArray = Array.from(merged.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);

    // Step 3: Push everything back (upsert handles dedup)
    const { uploaded, errors: pushErrors } =
      await pushEncryptedConversations(userId, mergedArray, keys);
    result.uploaded = uploaded;
    result.errors.push(...pushErrors);

    lastSyncTimestamp = Date.now();

    return { merged: mergedArray, result };
  } finally {
    syncInProgress = false;
  }
}

// ─── Incremental Sync ──────────────────────────────────────

/**
 * Push only conversations that changed since the last sync.
 * More efficient than fullSync for ongoing use.
 */
export async function incrementalPush(
  userId: string,
  changedConversations: Conversation[],
  keys: DerivedKeys
): Promise<{ uploaded: number; errors: string[] }> {
  if (changedConversations.length === 0) return { uploaded: 0, errors: [] };
  return pushEncryptedConversations(userId, changedConversations, keys);
}

// ─── Delete Remote ─────────────────────────────────────────

/**
 * Delete a conversation from the remote encrypted store.
 */
export async function deleteRemoteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    const { error } = await insforge.database
      .from('encrypted_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error && !isMissingSyncSchemaError(error)) {
      throw error;
    }
  } catch {
    // Non-critical — local delete succeeds regardless
    console.warn(`Failed to delete remote conversation ${conversationId}`);
  }
}

/**
 * Wipe all remote encrypted data for a user.
 * Called when user wants to "nuke everything."
 */
export async function deleteAllRemoteData(userId: string): Promise<void> {
  try {
    const { error } = await insforge.database
      .from('encrypted_conversations')
      .delete()
      .eq('user_id', userId);

    if (error && !isMissingSyncSchemaError(error)) {
      throw error;
    }
  } catch {
    console.warn('Failed to delete all remote data');
  }
}

// ─── Sync Status ───────────────────────────────────────────

export function getSyncStatus(pendingChanges: number): SyncStatus {
  return {
    lastSyncAt: lastSyncTimestamp,
    pendingChanges,
    issyncing: syncInProgress,
  };
}

// ─── Migration Helper ──────────────────────────────────────

/**
 * Migrate from plaintext remoteSync to encrypted privateSync.
 * 
 * Steps:
 *   1. Pull plaintext conversations from old schema
 *   2. Encrypt each one
 *   3. Push to new encrypted_conversations table
 *   4. Optionally delete old plaintext data
 */
export async function migrateFromPlaintextSync(
  userId: string,
  keys: DerivedKeys,
  defaultSettings: ChatSettings,
  deletePlaintext: boolean = false
): Promise<{ migrated: number; errors: string[] }> {
  const errors: string[] = [];
  let migrated = 0;

  try {
    // Import the old sync function dynamically to avoid circular deps
    const { fetchRemoteConversations } = await import('./remoteSync');
    const plaintextConvs = await fetchRemoteConversations(userId, defaultSettings);

    if (plaintextConvs.length === 0) {
      return { migrated: 0, errors: [] };
    }

    // Encrypt and push to new table
    const { uploaded, errors: pushErrors } =
      await pushEncryptedConversations(userId, plaintextConvs, keys);
    migrated = uploaded;
    errors.push(...pushErrors);

    // Optionally wipe old plaintext data
    if (deletePlaintext && migrated === plaintextConvs.length) {
      try {
        await insforge.database
          .from('conversations')
          .delete()
          .eq('user_id', userId);

        await insforge.database
          .from('messages')
          .delete()
          .in(
            'conversation_id',
            plaintextConvs.map(c => c.id)
          );
      } catch (err) {
        errors.push(
          `Plaintext cleanup failed: ${err instanceof Error ? err.message : 'unknown'}`
        );
      }
    }
  } catch (err) {
    errors.push(
      `Migration failed: ${err instanceof Error ? err.message : 'unknown'}`
    );
  }

  return { migrated, errors };
}

// ─── SQL Schema for InsForge ───────────────────────────────
// Run this migration on your InsForge database:
//
// CREATE TABLE IF NOT EXISTS encrypted_conversations (
//   id            TEXT PRIMARY KEY,
//   user_id       TEXT NOT NULL,
//   encrypted_blob TEXT NOT NULL,     -- JSON: { iv, ciphertext, version }
//   blob_version  INTEGER DEFAULT 1,
//   created_at    TIMESTAMPTZ DEFAULT NOW(),
//   updated_at    TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE INDEX idx_enc_conv_user ON encrypted_conversations(user_id);
// CREATE INDEX idx_enc_conv_updated ON encrypted_conversations(updated_at DESC);
//
// -- RLS: users can only access their own encrypted data
// ALTER TABLE encrypted_conversations ENABLE ROW LEVEL SECURITY;
// CREATE POLICY enc_conv_user_policy ON encrypted_conversations
//   USING (user_id = auth.uid())
//   WITH CHECK (user_id = auth.uid());
