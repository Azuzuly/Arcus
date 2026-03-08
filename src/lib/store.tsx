'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import {
  Conversation, SelectedModel, ChatSettings, MemoryItem, UsageData,
  TabType, ModalType, SettingsSection, ToastType, ModelInfo,
  AgentNode, AgentEdge, ExecutionLogEntry, StudioGeneration,
} from './types';
import { getStorage, setStorage, setStorageImmediate, clearAllStorage } from './storage';
import { generateUUID, getAvatarInitials, getAvatarColor } from './utils';

/* ---------- State shape ---------- */
export interface AppState {
  user: { username: string; apiKey: string; tier: 'free' | 'pro'; avatar: string; avatarColor: string };
  activeTab: TabType;
  conversations: Conversation[];
  activeChatId: string | null;
  isStreaming: boolean;
  chatSettings: ChatSettings;
  selectedModel: SelectedModel;
  allModels: ModelInfo[];
  favoriteModelIds: string[];
  studio: { activeSubTab: string; generationQueue: StudioGeneration[]; history: StudioGeneration[] };
  agent: { nodes: AgentNode[]; edges: AgentEdge[]; selectedNodeId: string | null; workflowName: string; isRunning: boolean; executionLog: ExecutionLogEntry[] };
  ui: { sidebarCollapsed: boolean; activeModal: ModalType; activeSettingsSection: SettingsSection; chatSettingsPanelOpen: boolean };
  memory: { enabled: boolean; items: MemoryItem[] };
  usage: UsageData;
  toasts: { id: string; message: string; type: ToastType }[];
  modalData: Record<string, unknown>;
  initialized: boolean;
}

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  systemPrompt: '', temperature: 0.7, maxTokens: 4096, topP: 1.0,
  topK: 0, frequencyPenalty: 0, presencePenalty: 0,
};

const DEFAULT_MODEL: SelectedModel = { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' };

function initialState(): AppState {
  return {
    user: { username: '', apiKey: '', tier: 'free', avatar: '', avatarColor: '' },
    activeTab: 'home',
    conversations: [],
    activeChatId: null,
    isStreaming: false,
    chatSettings: { ...DEFAULT_CHAT_SETTINGS },
    selectedModel: DEFAULT_MODEL,
    allModels: [],
    favoriteModelIds: [],
    studio: { activeSubTab: 'image', generationQueue: [], history: [] },
    agent: { nodes: [], edges: [], selectedNodeId: null, workflowName: 'Untitled Workflow', isRunning: false, executionLog: [] },
    ui: { sidebarCollapsed: false, activeModal: null, activeSettingsSection: 'account', chatSettingsPanelOpen: false },
    memory: { enabled: true, items: [] },
    usage: { today: { requests: 0, limit: 150 }, history: [], modelBreakdown: {} },
    toasts: [],
    modalData: {},
    initialized: false,
  };
}

/* ---------- Actions ---------- */
type Action =
  | { type: 'INIT'; state: Partial<AppState> }
  | { type: 'SET_USER'; user: AppState['user'] }
  | { type: 'SET_TAB'; tab: TabType }
  | { type: 'SET_CONVERSATIONS'; conversations: Conversation[] }
  | { type: 'ADD_CONVERSATION'; conversation: Conversation }
  | { type: 'UPDATE_CONVERSATION'; id: string; updates: Partial<Conversation> }
  | { type: 'REMOVE_CONVERSATION'; id: string }
  | { type: 'SET_ACTIVE_CHAT'; id: string | null }
  | { type: 'SET_STREAMING'; streaming: boolean }
  | { type: 'SET_CHAT_SETTINGS'; settings: Partial<ChatSettings> }
  | { type: 'SET_SELECTED_MODEL'; model: SelectedModel }
  | { type: 'SET_ALL_MODELS'; models: ModelInfo[] }
  | { type: 'TOGGLE_FAVORITE_MODEL'; modelId: string }
  | { type: 'SET_UI'; ui: Partial<AppState['ui']> }
  | { type: 'SHOW_MODAL'; modal: ModalType; data?: Record<string, unknown> }
  | { type: 'HIDE_MODAL' }
  | { type: 'SET_MEMORY'; memory: Partial<AppState['memory']> }
  | { type: 'ADD_MEMORY_ITEM'; item: MemoryItem }
  | { type: 'REMOVE_MEMORY_ITEM'; id: string }
  | { type: 'SET_USAGE'; usage: Partial<UsageData> }
  | { type: 'TRACK_REQUEST'; modelId: string; tokens: number }
  | { type: 'ADD_TOAST'; toast: { id: string; message: string; type: ToastType } }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'SET_AGENT'; agent: Partial<AppState['agent']> }
  | { type: 'ADD_AGENT_NODE'; node: AgentNode }
  | { type: 'UPDATE_AGENT_NODE'; id: string; updates: Partial<AgentNode> }
  | { type: 'REMOVE_AGENT_NODE'; id: string }
  | { type: 'ADD_AGENT_EDGE'; edge: AgentEdge }
  | { type: 'REMOVE_AGENT_EDGE'; id: string }
  | { type: 'SET_STUDIO'; studio: Partial<AppState['studio']> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SIGN_OUT' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT': return { ...state, ...action.state, initialized: true };
    case 'SET_USER': return { ...state, user: action.user };
    case 'SET_TAB': return { ...state, activeTab: action.tab };
    case 'SET_CONVERSATIONS': return { ...state, conversations: action.conversations };
    case 'ADD_CONVERSATION': return { ...state, conversations: [action.conversation, ...state.conversations] };
    case 'UPDATE_CONVERSATION': return {
      ...state,
      conversations: state.conversations.map(c => c.id === action.id ? { ...c, ...action.updates, updatedAt: Date.now() } : c),
    };
    case 'REMOVE_CONVERSATION': {
      const convs = state.conversations.filter(c => c.id !== action.id);
      return { ...state, conversations: convs, activeChatId: state.activeChatId === action.id ? (convs[0]?.id || null) : state.activeChatId };
    }
    case 'SET_ACTIVE_CHAT': return { ...state, activeChatId: action.id, chatSettings: state.conversations.find(c => c.id === action.id)?.settings || { ...DEFAULT_CHAT_SETTINGS } };
    case 'SET_STREAMING': return { ...state, isStreaming: action.streaming };
    case 'SET_CHAT_SETTINGS': return { ...state, chatSettings: { ...state.chatSettings, ...action.settings } };
    case 'SET_SELECTED_MODEL': return { ...state, selectedModel: action.model };
    case 'SET_ALL_MODELS': return { ...state, allModels: action.models };
    case 'TOGGLE_FAVORITE_MODEL': {
      const favs = state.favoriteModelIds.includes(action.modelId)
        ? state.favoriteModelIds.filter(id => id !== action.modelId)
        : [...state.favoriteModelIds, action.modelId];
      return { ...state, favoriteModelIds: favs };
    }
    case 'SET_UI': return { ...state, ui: { ...state.ui, ...action.ui } };
    case 'SHOW_MODAL': return { ...state, ui: { ...state.ui, activeModal: action.modal }, modalData: action.data || {} };
    case 'HIDE_MODAL': return { ...state, ui: { ...state.ui, activeModal: null }, modalData: {} };
    case 'SET_MEMORY': return { ...state, memory: { ...state.memory, ...action.memory } };
    case 'ADD_MEMORY_ITEM': return { ...state, memory: { ...state.memory, items: [...state.memory.items, action.item] } };
    case 'REMOVE_MEMORY_ITEM': return { ...state, memory: { ...state.memory, items: state.memory.items.filter(i => i.id !== action.id) } };
    case 'SET_USAGE': return { ...state, usage: { ...state.usage, ...action.usage } };
    case 'TRACK_REQUEST': {
      const today = { ...state.usage.today, requests: state.usage.today.requests + 1 };
      const mb = { ...state.usage.modelBreakdown };
      const existing = mb[action.modelId] || { count: 0, tokens: 0 };
      mb[action.modelId] = { count: existing.count + 1, tokens: existing.tokens + action.tokens };
      return { ...state, usage: { ...state.usage, today, modelBreakdown: mb } };
    }
    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, action.toast] };
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };
    case 'SET_AGENT': return { ...state, agent: { ...state.agent, ...action.agent } };
    case 'ADD_AGENT_NODE': return { ...state, agent: { ...state.agent, nodes: [...state.agent.nodes, action.node] } };
    case 'UPDATE_AGENT_NODE': return { ...state, agent: { ...state.agent, nodes: state.agent.nodes.map(n => n.id === action.id ? { ...n, ...action.updates } : n) } };
    case 'REMOVE_AGENT_NODE': {
      const nodes = state.agent.nodes.filter(n => n.id !== action.id);
      const edges = state.agent.edges.filter(e => e.sourceId !== action.id && e.targetId !== action.id);
      return { ...state, agent: { ...state.agent, nodes, edges, selectedNodeId: state.agent.selectedNodeId === action.id ? null : state.agent.selectedNodeId } };
    }
    case 'ADD_AGENT_EDGE': return { ...state, agent: { ...state.agent, edges: [...state.agent.edges, action.edge] } };
    case 'REMOVE_AGENT_EDGE': return { ...state, agent: { ...state.agent, edges: state.agent.edges.filter(e => e.id !== action.id) } };
    case 'SET_STUDIO': return { ...state, studio: { ...state.studio, ...action.studio } };
    case 'TOGGLE_SIDEBAR': return { ...state, ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed } };
    case 'SIGN_OUT': { clearAllStorage(); return initialState(); }
    default: return state;
  }
}

/* ---------- Context ---------- */
interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  showToast: (message: string, type?: ToastType) => void;
  createNewChat: () => string;
  activeConversation: Conversation | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState());
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load from localStorage on mount
  useEffect(() => {
    const username = getStorage<string>('username', '');
    const apiKey = getStorage<string>('api_key', '');
    const tier = getStorage<'free' | 'pro'>('tier', 'free');
    const conversations = getStorage<Conversation[]>('conversations', []);
    const model = getStorage<SelectedModel>('model', DEFAULT_MODEL);
    const memory = getStorage<AppState['memory']>('memory', { enabled: true, items: [] });
    const usage = getStorage<UsageData>('usage', { today: { requests: 0, limit: 150 }, history: [], modelBreakdown: {} });
    const favorites = getStorage<string[]>('favorites', []);

    dispatch({
      type: 'INIT',
      state: {
        user: {
          username,
          apiKey,
          tier,
          avatar: username ? getAvatarInitials(username) : '',
          avatarColor: username ? getAvatarColor(username) : '#3B82F6',
        },
        conversations: conversations.sort((a, b) => b.updatedAt - a.updatedAt),
        activeChatId: conversations[0]?.id || null,
        selectedModel: model,
        memory,
        usage,
        favoriteModelIds: favorites,
      },
    });
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (!state.initialized) return;
    setStorage('conversations', state.conversations);
    setStorage('model', state.selectedModel);
    setStorage('memory', state.memory);
    setStorage('usage', state.usage);
    setStorage('favorites', state.favoriteModelIds);
  }, [state.conversations, state.selectedModel, state.memory, state.usage, state.favoriteModelIds, state.initialized]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateUUID();
    dispatch({ type: 'ADD_TOAST', toast: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000);
  }, []);

  const createNewChat = useCallback(() => {
    const id = generateUUID();
    const conversation: Conversation = {
      id,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: stateRef.current.selectedModel,
      messages: [],
      settings: { ...DEFAULT_CHAT_SETTINGS },
      pinned: false,
    };
    dispatch({ type: 'ADD_CONVERSATION', conversation });
    dispatch({ type: 'SET_ACTIVE_CHAT', id });
    return id;
  }, []);

  const activeConversation = state.conversations.find(c => c.id === state.activeChatId);

  return (
    <StoreContext.Provider value={{ state, dispatch, showToast, createNewChat, activeConversation }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export { DEFAULT_CHAT_SETTINGS };
