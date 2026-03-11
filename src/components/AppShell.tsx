'use client';

import { useStore } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import ChatView from './ChatView';
import StudioView from './StudioView';
import AgentView from './AgentView';
import OnboardingFlow from './OnboardingFlow';
import LandingPage from './LandingPage';
import SettingsModal from './SettingsModal';
import PricingModal from './PricingModal';
import CommandPalette from './CommandPalette';
import Toast from './Toast';
import { fetchModels } from '@/lib/openrouter';
import RenameModal from './RenameModal';
import DeleteModal from './DeleteModal';
import PersonalizationPanel from './PersonalizationPanel';
import UpgradeNudges from './UpgradeNudges';

export default function AppShell() {
  const { state, dispatch, showToast } = useStore();
  const [isMobile, setIsMobile] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const wasMobileRef = useRef<boolean | null>(null);
  const shellTopInset = 78;
  const resolvedTab = state.activeTab === 'chat'
    ? 'home'
    : state.activeTab === 'agent'
      ? 'agents'
      : state.activeTab;

  const openAuth = (mode: 'signup' | 'signin' = 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  useEffect(() => {
    const syncViewport = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && wasMobileRef.current === false && !state.ui.sidebarCollapsed) {
        dispatch({ type: 'SET_UI', ui: { sidebarCollapsed: true } });
      }
      wasMobileRef.current = mobile;
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, [dispatch, state.ui.sidebarCollapsed]);

  useEffect(() => {
    if (!state.initialized) return;
    if (resolvedTab !== 'home' && resolvedTab !== 'research') return;

    const desiredWorkspace = resolvedTab === 'research' ? 'research' : 'home';
    const activeConversation = state.conversations.find(conversation => conversation.id === state.activeChatId);

    if (!activeConversation || (activeConversation.workspace || 'home') !== desiredWorkspace) {
      const nextConversation = state.conversations
        .filter(conversation => (conversation.workspace || 'home') === desiredWorkspace)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];

      dispatch({ type: 'SET_ACTIVE_CHAT', id: nextConversation?.id || null });
    }

  }, [dispatch, resolvedTab, state.activeChatId, state.conversations, state.initialized]);

  // Fetch models on init
  useEffect(() => {
    if (!state.initialized) return;
    fetchModels().then(models => {
      dispatch({ type: 'SET_ALL_MODELS', models });
    }).catch(() => {
      showToast('Could not fetch models.', 'warning');
    });
  }, [state.initialized, dispatch, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') { e.preventDefault(); dispatch({ type: 'SHOW_MODAL', modal: state.ui.activeModal === 'model-selector' ? null : 'model-selector' }); }
      if (mod && e.key === 'n') { e.preventDefault(); dispatch({ type: 'SET_TAB', tab: 'home' }); }
      if (mod && e.key === ',') { e.preventDefault(); dispatch({ type: 'SHOW_MODAL', modal: 'settings' }); }
      if (mod && e.key === '/') { e.preventDefault(); dispatch({ type: 'TOGGLE_SIDEBAR' }); }
      if (e.key === 'Escape') { dispatch({ type: 'HIDE_MODAL' }); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch, state.ui.activeModal]);

  if (!state.initialized) return <div style={{ background: '#050505', height: '100vh' }} />;

  if (!state.user.id) {
    return (
      <>
        <LandingPage onEnter={openAuth} />
        {authOpen && (
          <OnboardingFlow
            initialMode={authMode}
            defaultStep={2}
            onClose={() => setAuthOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div id="app" style={{
      height: '100dvh', width: '100vw', position: 'relative', overflow: 'hidden',
      background: '#090b10',
    }}>
      <TopNav />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {(resolvedTab === 'home' || resolvedTab === 'research') && !state.ui.sidebarCollapsed && (
          <>
            {isMobile && (
              <div onClick={() => dispatch({ type: 'SET_UI', ui: { sidebarCollapsed: true } })} style={{
                position: 'absolute', inset: 0, background: 'rgba(4,5,7,0.46)', backdropFilter: 'blur(8px)', zIndex: 24,
              }} />
            )}
            <div style={{ position: 'absolute', top: shellTopInset, bottom: 18, left: 18, zIndex: 25, maxWidth: isMobile ? 'calc(100vw - 36px)' : 360 }}>
              <Sidebar key={resolvedTab} />
            </div>
          </>
        )}
        {(resolvedTab === 'home' || resolvedTab === 'research') && state.ui.sidebarCollapsed && (
          <button
            type="button"
            aria-label="Open saved chats"
            onClick={() => dispatch({ type: 'SET_UI', ui: { sidebarCollapsed: false } })}
            className="liquid-btn"
            style={{
              position: 'absolute',
              top: shellTopInset + 6,
              left: 18,
              zIndex: 26,
              padding: '10px 14px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 15 }}>☰</span>
            <span>{resolvedTab === 'research' ? 'Research library' : 'Saved chats'}</span>
          </button>
        )}
        <main style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'rgba(8,10,16,0.72)' }}>
          {resolvedTab === 'home' && <ChatView workspace="home" />}
          {resolvedTab === 'research' && <ChatView workspace="research" />}
          {resolvedTab === 'studio' && <StudioView />}
          {resolvedTab === 'agents' && <AgentView />}
        </main>
      </div>

      {state.ui.activeModal === 'settings' && <SettingsModal />}
      {state.ui.activeModal === 'pricing' && <PricingModal />}
      {state.ui.activeModal === 'rename' && <RenameModal />}
      {state.ui.activeModal === 'delete' && <DeleteModal />}
      {state.ui.activeModal === 'personalization' && <PersonalizationPanel />}
      <UpgradeNudges />
      <CommandPalette />
      <Toast />
    </div>
  );
}
