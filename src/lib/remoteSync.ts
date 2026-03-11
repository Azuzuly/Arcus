import { Conversation, Message, SelectedModel, ChatSettings } from './types';
import { insforge } from './insforge';
import { ROUTER_SELECTED_MODEL } from './modelRouter';

interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  model: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

const blockedRemoteSyncUsers = new Set<string>();

/**
 * Checks whether the error indicates the sync tables (conversations / messages)
 * have not been created yet.  The previous regex also matched the bare words
 * "conversations" and "messages" which swallowed unrelated errors.
 */
function isMissingSyncSchemaError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';

  return /relation ["']?\w+["']? does not exist|table ["']?\w+["']? does not exist|42P01/i.test(message);
}

/**
 * Checks for genuine auth / permission errors from the backend.
 * Narrowed to avoid false positives on messages that merely *mention*
 * words like "token" or "auth" in a different context.
 */
function isUnauthorizedSyncError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';

  // Match HTTP status codes or specific auth-failure phrases
  return /\b(401|403)\b|\bunauthori[sz]ed\b|\bforbidden\b|JWT\s+(expired|invalid|malformed)|invalid.*refresh.*token/i.test(message);
}

function shouldSkipRemoteSync(userId: string): boolean {
  return blockedRemoteSyncUsers.has(userId);
}

function blockRemoteSync(userId: string): void {
  blockedRemoteSyncUsers.add(userId);
}

export function resetRemoteSyncAuthState(userId?: string): void {
  if (!userId) {
    blockedRemoteSyncUsers.clear();
    return;
  }

  blockedRemoteSyncUsers.delete(userId);
}

function toTimestamp(value: string | null | undefined, fallback: number): number {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function serializeModel(model: SelectedModel): string {
  return JSON.stringify(model);
}

function deserializeModel(value: string | null | undefined): SelectedModel {
  if (!value) {
    return ROUTER_SELECTED_MODEL;
  }

  try {
    const parsed = JSON.parse(value) as Partial<SelectedModel>;
    if (parsed.id && parsed.name && parsed.provider) {
      return { id: parsed.id, name: parsed.name, provider: parsed.provider, runtime: parsed.runtime || 'puter' };
    }
  } catch {
    // fall back below
  }

  return {
    id: value,
    name: value.split('/').pop()?.replace(/[-_]/g, ' ') || 'Saved Model',
    provider: value.split('/')[0] || 'Unknown',
    runtime: 'puter',
  };
}

export async function fetchRemoteConversations(userId: string, defaultSettings: ChatSettings): Promise<Conversation[]> {
  if (shouldSkipRemoteSync(userId)) return [];

  const { data: conversations, error } = await insforge.database
    .from('conversations')
    .select('id,user_id,title,model,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingSyncSchemaError(error)) return [];
    if (isUnauthorizedSyncError(error)) {
      blockRemoteSync(userId);
      return [];
    }
    throw error;
  }

  if (!conversations || conversations.length === 0) return [];

  const conversationIds = (conversations as ConversationRow[]).map(c => c.id);

  const { data: messages, error: msgError } = await insforge.database
    .from('messages')
    .select('id,conversation_id,role,content,created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true });

  if (msgError && !isMissingSyncSchemaError(msgError)) {
    if (isUnauthorizedSyncError(msgError)) {
      blockRemoteSync(userId);
      return [];
    }
    throw msgError;
  }

  const msgsByConv = new Map<string, MessageRow[]>();
  for (const m of (messages || []) as MessageRow[]) {
    const list = msgsByConv.get(m.conversation_id) || [];
    list.push(m);
    msgsByConv.set(m.conversation_id, list);
  }

  const now = Date.now();
  return (conversations as ConversationRow[]).map(conv => {
    const convMessages: Message[] = (msgsByConv.get(conv.id) || []).map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: toTimestamp(m.created_at, now),
    }));

    return {
      id: conv.id,
      title: conv.title || 'Untitled',
      messages: convMessages,
      model: deserializeModel(conv.model),
      settings: { ...defaultSettings },
      createdAt: toTimestamp(conv.created_at, now),
      updatedAt: toTimestamp(conv.updated_at, now),
      pinned: false,
      source: 'remote' as const,
    };
  });
}

export async function pushConversationToRemote(
  userId: string,
  conversation: Conversation
): Promise<void> {
  if (shouldSkipRemoteSync(userId)) return;

  try {
    const { error: convError } = await insforge.database
      .from('conversations')
      .upsert({
        id: conversation.id,
        user_id: userId,
        title: conversation.title || 'Untitled',
        model: serializeModel(conversation.model),
        created_at: new Date(conversation.createdAt).toISOString(),
        updated_at: new Date(conversation.updatedAt).toISOString(),
      }, { onConflict: 'id' });

    if (convError) {
      if (isMissingSyncSchemaError(convError)) return;
      if (isUnauthorizedSyncError(convError)) {
        blockRemoteSync(userId);
        return;
      }
      throw convError;
    }

    if (conversation.messages.length === 0) return;

    const messageRows = conversation.messages.map(m => ({
      id: m.id,
      conversation_id: conversation.id,
      role: m.role,
      content: m.content,
      created_at: new Date(m.timestamp).toISOString(),
    }));

    const { error: msgError } = await insforge.database
      .from('messages')
      .upsert(messageRows, { onConflict: 'id' });

    if (msgError) {
      if (isMissingSyncSchemaError(msgError)) return;
      if (isUnauthorizedSyncError(msgError)) {
        blockRemoteSync(userId);
        return;
      }
      throw msgError;
    }
  } catch (err) {
    if (isMissingSyncSchemaError(err)) return;
    if (isUnauthorizedSyncError(err)) {
      blockRemoteSync(userId);
      return;
    }
    throw err;
  }
}

export async function deleteRemoteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  if (shouldSkipRemoteSync(userId)) return;

  try {
    await insforge.database
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    await insforge.database
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);
  } catch (err) {
    if (isMissingSyncSchemaError(err)) return;
    if (isUnauthorizedSyncError(err)) {
      blockRemoteSync(userId);
      return;
    }
    throw err;
  }
}
