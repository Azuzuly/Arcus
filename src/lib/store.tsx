'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import {
  Conversation, SelectedModel, ChatSettings, MemoryItem, UsageData,
  TabType, ModalType, SettingsSection, ToastType, ModelInfo,
  AgentNode, AgentEdge, AgentWorkflow, StudioGeneration, PersonalizationSettings,
} from './types';
import { getStorage, setStorage, clearAllStorage } from './storage';
import { generateUUID } from './utils';
import { insforge, persistInsforgeSessionLocally } from './insforge';
import { createGuestUserState, mapInsforgeUserToStateUser } from './auth';
import { fetchRemoteConversations, resetRemoteSyncAuthState, syncRemoteConversations } from './remoteSync';
import { ROUTER_SELECTED_MODEL } from './modelRouter';

/* ---------- State shape ---------- */
export interface AppState {
  user: { id: string; email: string; emailVerified: boolean; username: string; apiKey: string; tier: 'free' | 'pro' | 'owner'; avatar: string; avatarColor: string };
  activeTab: TabType;
  conversations: Conversation[];
  activeChatId: string | null;
  isStreaming: boolean;
  chatSettings: ChatSettings;
  selectedModel: SelectedModel;
  allModels: ModelInfo[];
  favoriteModelIds: string[];
  studio: { activeSubTab: string; generationQueue: StudioGeneration[]; history: StudioGeneration[]; selectedGenerationId: string | null };
  agent: AgentWorkflow;
  ui: { sidebarCollapsed: boolean; activeModal: ModalType; activeSettingsSection: SettingsSection; chatSettingsPanelOpen: boolean };
  memory: { enabled: boolean; items: MemoryItem[] };
  preferences: PersonalizationSettings;
  usage: UsageData;
  toasts: { id: string; message: string; type: ToastType }[];
  modalData: Record<string, unknown>;
  settings: { backgroundImage: string; accentColor: string; profileImage: string };
  initialized: boolean;
}

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  systemPrompt: '', temperature: 0.7, maxTokens: 4096, topP: 1.0,
  topK: 0, frequencyPenalty: 0, presencePenalty: 0,
};

const DEFAULT_PREFERENCES: PersonalizationSettings = {
  webSearchEnabled: true,
  autoWebSearch: true,
  responseStyle: 'balanced',
  researchDepth: 'deep',
  trustedDomains: [],
  autoScrollOnStream: true,
  animationsEnabled: true,
  showTimestamps: false,
  compactChatSpacing: false,
};

const DEFAULT_MODEL: SelectedModel = ROUTER_SELECTED_MODEL;

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

function initialState(): AppState {
  return {
    user: createGuestUserState(),
    activeTab: 'home',
    conversations: [],
    activeChatId: null,
    isStreaming: false,
    chatSettings: { ...DEFAULT_CHAT_SETTINGS },
    selectedModel: DEFAULT_MODEL,
    allModels: [],
    favoriteModelIds: [],
    studio: { activeSubTab: 'generate', generationQueue: [], history: [], selectedGenerationId: null },
    agent: {
      nodes: [],
      edges: [],
      selectedNodeId: null,
      workflowName: 'Untitled Workflow',
      activeSavedWorkflowId: null,
      isRunning: false,
      executionLog: [],
      triggerInput: '',
      lastRunOutput: undefined,
      lastRunStatus: 'idle',
      lastRunError: null,
      lastRunAt: null,
      lastRunSteps: {},
      runHistory: [],
      savedWorkflows: [],
    },
    ui: { sidebarCollapsed: true, activeModal: null, activeSettingsSection: 'account', chatSettingsPanelOpen: false },
    memory: { enabled: true, items: [] },
    preferences: { ...DEFAULT_PREFERENCES },
    usage: { today: { requests: 0, limit: 150 }, history: [], modelBreakdown: {} },
    toasts: [],
    modalData: {},
    settings: { backgroundImage: '', accentColor: '#3B82F6', profileImage: '' },
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
  | { type: 'SET_PREFERENCES'; preferences: Partial<PersonalizationSettings> }
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
  | { type: 'SET_SETTINGS'; settings: Partial<AppState['settings']> }
  | { type: 'TOGGLE_PIN_CONVERSATION'; id: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SIGN_OUT' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT': return { ...state, ...action.state, initialized: true };
    case 'SET_USER': return { ...state, user: action.user };
    case 'SET_TAB': return { ...state, activeTab: action.tab };
    case 'SET_CONVERSATIONS': return { ...state, conversations: sortConversations(action.conversations) };
    case 'ADD_CONVERSATION': return { ...state, conversations: sortConversations([action.conversation, ...state.conversations]) };
    case 'UPDATE_CONVERSATION': return {
      ...state,
      conversations: sortConversations(state.conversations.map(c => c.id === action.id ? { ...c, ...action.updates, updatedAt: Date.now() } : c)),
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
    case 'SET_PREFERENCES': return { ...state, preferences: { ...state.preferences, ...action.preferences } };
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
    case 'SET_SETTINGS': return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'TOGGLE_PIN_CONVERSATION': return {
      ...state,
      conversations: sortConversations(
        state.conversations.map(c => c.id === action.id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c)
      ),
    };
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
  const hasHydratedRemoteRef = useRef(false);
  const lastSessionSyncAtRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load from localStorage on mount
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const model = getStorage<SelectedModel>('model', DEFAULT_MODEL);
      const memory = getStorage<AppState['memory']>('memory', { enabled: true, items: [] });
      const preferences = getStorage<PersonalizationSettings>('preferences', DEFAULT_PREFERENCES);
      const usage = getStorage<UsageData>('usage', { today: { requests: 0, limit: 150 }, history: [], modelBreakdown: {} });
      const favorites = getStorage<string[]>('favorites', []);
      const savedSettings = getStorage<AppState['settings']>('settings', { backgroundImage: '', accentColor: '#3B82F6', profileImage: '' });
      const cachedConversations = getStorage<Conversation[]>('conversations', []);
      const studio = getStorage<AppState['studio']>('studio', { activeSubTab: 'generate', generationQueue: [], history: [], selectedGenerationId: null });
      const agent = getStorage<AppState['agent']>('agent', {
        nodes: [],
        edges: [],
        selectedNodeId: null,
        workflowName: 'Untitled Workflow',
        activeSavedWorkflowId: null,
        isRunning: false,
        executionLog: [],
        triggerInput: '',
        lastRunOutput: undefined,
        lastRunStatus: 'idle',
        lastRunError: null,
        lastRunAt: null,
        lastRunSteps: {},
        runHistory: [],
        savedWorkflows: [],
      });
      let user = createGuestUserState();

      const { data } = await insforge.auth.getCurrentSession();
      if (data.session?.user) {
        persistInsforgeSessionLocally();
        user = mapInsforgeUserToStateUser(data.session.user);
        resetRemoteSyncAuthState(data.session.user.id);
        if (typeof window !== 'undefined') {
          const pendingAuthMethod = window.sessionStorage.getItem('arcus_pending_auth_method');
          if (pendingAuthMethod === 'google' || pendingAuthMethod === 'github') {
            window.localStorage.setItem('arcus_last_auth_method', pendingAuthMethod);
            window.sessionStorage.removeItem('arcus_pending_auth_method');
          }
        }
      }

      let mergedConversations = sortConversations(cachedConversations);

      if (user.id) {
        try {
          const remoteConversations = await fetchRemoteConversations(user.id, DEFAULT_CHAT_SETTINGS);
          const localById = new Map(cachedConversations.map(conversation => [conversation.id, conversation]));
          mergedConversations = sortConversations(remoteConversations.map(remoteConversation => {
            const localConversation = localById.get(remoteConversation.id);

            if (!localConversation) return remoteConversation;

            return localConversation.updatedAt >= remoteConversation.updatedAt
              ? localConversation
              : {
                  ...remoteConversation,
                  settings: localConversation.settings,
                  pinned: localConversation.pinned,
                };
          }).concat(cachedConversations.filter(conversation => !remoteConversations.some(remote => remote.id === conversation.id))));
        } catch {
          mergedConversations = sortConversations(cachedConversations);
        }
      }

      if (cancelled) return;

      hasHydratedRemoteRef.current = true;

      // Owner role: unlimited usage
      const OWNER_EMAILS = ['azuzuly79@pm.me'];
      if (OWNER_EMAILS.includes(user.email.toLowerCase())) {
        user = { ...user, tier: 'owner' };
        usage.today.limit = 999999;
      }

      dispatch({
        type: 'INIT',
        state: {
          user,
          conversations: mergedConversations,
          activeChatId: mergedConversations[0]?.id || null,
          selectedModel: model,
          memory,
          preferences,
          usage,
          favoriteModelIds: favorites,
          settings: savedSettings,
          studio,
          agent,
        },
      });
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (!state.initialized) return;
    setStorage('conversations', state.conversations);
    setStorage('model', state.selectedModel);
    setStorage('memory', state.memory);
    setStorage('preferences', state.preferences);
    setStorage('usage', state.usage);
    setStorage('favorites', state.favoriteModelIds);
    setStorage('settings', state.settings);
    setStorage('studio', state.studio);
    setStorage('agent', state.agent);
  }, [state.conversations, state.selectedModel, state.memory, state.preferences, state.usage, state.favoriteModelIds, state.settings, state.studio, state.agent, state.initialized]);

  useEffect(() => {
    if (!state.initialized || !state.user.id || !hasHydratedRemoteRef.current) return;

    const timer = setTimeout(() => {
      void syncRemoteConversations(state.user.id, state.conversations).catch(() => {
        // keep local experience resilient even if remote sync fails
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [state.conversations, state.initialized, state.user.id]);

  useEffect(() => {
    if (!state.initialized || !state.user.id) return;

    const syncSession = async () => {
      if (Date.now() - lastSessionSyncAtRef.current < 12000) return;
      lastSessionSyncAtRef.current = Date.now();

      const { data } = await insforge.auth.getCurrentSession();
      if (!data.session?.user) return;

      persistInsforgeSessionLocally();
      resetRemoteSyncAuthState(data.session.user.id);
      const mappedUser = mapInsforgeUserToStateUser(data.session.user);
      const currentUser = stateRef.current.user;

      if (
        currentUser.id !== mappedUser.id ||
        currentUser.email !== mappedUser.email ||
        currentUser.username !== mappedUser.username ||
        currentUser.emailVerified !== mappedUser.emailVerified
      ) {
        dispatch({ type: 'SET_USER', user: mappedUser });
      }
    };

    const handleFocus = () => {
      void syncSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dispatch, state.initialized, state.user.id]);

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
