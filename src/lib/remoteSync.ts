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

function isMissingSyncSchemaError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';

  return /relation .* does not exist|table .* does not exist|conversations|messages/i.test(message);
}

function isUnauthorizedSyncError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';

  return /401|403|unauthori[sz]ed|forbidden|jwt|token|auth/i.test(message);
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

  const rows = (conversations || []) as ConversationRow[];
  if (rows.length === 0) return [];

  const ids = rows.map(row => row.id);
  const { data: messages, error: messagesError } = await insforge.database
    .from('messages')
    .select('id,conversation_id,role,content,created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: true });

  if (messagesError) {
    if (isMissingSyncSchemaError(messagesError)) return [];
    if (isUnauthorizedSyncError(messagesError)) {
      blockRemoteSync(userId);
      return [];
    }
    throw messagesError;
  }

  const messageRows = (messages || []) as MessageRow[];
  const groupedMessages = new Map<string, Message[]>();

  for (const row of messageRows) {
    const nextMessage: Message = {
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: toTimestamp(row.created_at, Date.now()),
    };
    const bucket = groupedMessages.get(row.conversation_id) || [];
    bucket.push(nextMessage);
    groupedMessages.set(row.conversation_id, bucket);
  }

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    createdAt: toTimestamp(row.created_at, Date.now()),
    updatedAt: toTimestamp(row.updated_at, Date.now()),
    model: deserializeModel(row.model),
    messages: groupedMessages.get(row.id) || [],
    settings: { ...defaultSettings },
    pinned: false,
  }));
}

export async function syncRemoteConversations(userId: string, conversations: Conversation[]): Promise<void> {
  if (shouldSkipRemoteSync(userId)) return;

  const safeConversations = conversations.map(conversation => ({
    ...conversation,
    messages: conversation.messages.filter(message => !message.isStreaming),
  }));

  const { data: existingData, error: existingError } = await insforge.database
    .from('conversations')
    .select('id')
    .eq('user_id', userId);

  if (existingError) {
    if (isMissingSyncSchemaError(existingError)) return;
    if (isUnauthorizedSyncError(existingError)) {
      blockRemoteSync(userId);
      return;
    }
    throw existingError;
  }

  const existingIds = new Set(((existingData || []) as Array<{ id: string }>).map(row => row.id));
  const localIds = new Set(safeConversations.map(conversation => conversation.id));
  const remoteOnlyIds = [...existingIds].filter(id => !localIds.has(id));

  if (remoteOnlyIds.length > 0) {
    const { error: deleteRemoteMessagesError } = await insforge.database.from('messages').delete().in('conversation_id', remoteOnlyIds);
    if (deleteRemoteMessagesError && !isMissingSyncSchemaError(deleteRemoteMessagesError)) {
      if (isUnauthorizedSyncError(deleteRemoteMessagesError)) {
        blockRemoteSync(userId);
        return;
      }
      throw deleteRemoteMessagesError;
    }

    const { error: deleteRemoteConversationsError } = await insforge.database.from('conversations').delete().in('id', remoteOnlyIds);
    if (deleteRemoteConversationsError && !isMissingSyncSchemaError(deleteRemoteConversationsError)) {
      if (isUnauthorizedSyncError(deleteRemoteConversationsError)) {
        blockRemoteSync(userId);
        return;
      }
      throw deleteRemoteConversationsError;
    }
  }

  for (const conversation of safeConversations) {
    const payload = {
      id: conversation.id,
      user_id: userId,
      title: conversation.title,
      model: serializeModel(conversation.model),
      created_at: new Date(conversation.createdAt).toISOString(),
      updated_at: new Date(conversation.updatedAt).toISOString(),
    };

    if (existingIds.has(conversation.id)) {
      const { error } = await insforge.database
        .from('conversations')
        .update({
          title: payload.title,
          model: payload.model,
          updated_at: payload.updated_at,
        })
        .eq('id', conversation.id)
        .eq('user_id', userId);

      if (error) {
        if (isMissingSyncSchemaError(error)) return;
        if (isUnauthorizedSyncError(error)) {
          blockRemoteSync(userId);
          return;
        }
        throw error;
      }
    } else {
      const { error } = await insforge.database.from('conversations').insert(payload);
      if (error) {
        if (isMissingSyncSchemaError(error)) return;
        if (isUnauthorizedSyncError(error)) {
          blockRemoteSync(userId);
          return;
        }
        throw error;
      }
    }

    const { error: deleteMessagesError } = await insforge.database
      .from('messages')
      .delete()
      .eq('conversation_id', conversation.id);

    if (deleteMessagesError) {
      if (isMissingSyncSchemaError(deleteMessagesError)) return;
      if (isUnauthorizedSyncError(deleteMessagesError)) {
        blockRemoteSync(userId);
        return;
      }
      throw deleteMessagesError;
    }

    if (conversation.messages.length > 0) {
      const messagePayload = conversation.messages.map(message => ({
        id: message.id,
        conversation_id: conversation.id,
        role: message.role,
        content: message.content,
        created_at: new Date(message.timestamp).toISOString(),
      }));

      const { error: insertMessagesError } = await insforge.database.from('messages').insert(messagePayload);
      if (insertMessagesError) {
        if (isMissingSyncSchemaError(insertMessagesError)) return;
        if (isUnauthorizedSyncError(insertMessagesError)) {
          blockRemoteSync(userId);
          return;
        }
        throw insertMessagesError;
      }
    }
  }
}
