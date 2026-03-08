'use client';

import { useStore } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import ChatView from './ChatView';
import StudioView from './StudioView';
import AgentView from './AgentView';
import OnboardingFlow from './OnboardingFlow';
import SettingsModal from './SettingsModal';
import PricingModal from './PricingModal';
import CommandPalette from './CommandPalette';
import Toast from './Toast';
import { fetchModels } from '@/lib/openrouter';
import RenameModal from './RenameModal';
import DeleteModal from './DeleteModal';
import PersonalizationPanel from './PersonalizationPanel';

export default function AppShell() {
  const { state, dispatch, showToast } = useStore();
  const [isMobile, setIsMobile] = useState(false);
  const wasMobileRef = useRef<boolean | null>(null);

  useEffect(() => {
    const syncViewport = () => {
      const mobile = window.innerWidth <= 960;
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

  if (!state.user.id) return <OnboardingFlow />;

  return (
    <div id="app" style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden',
      background: '#090b10',
    }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {state.activeTab === 'home' && !isMobile && <Sidebar />}
        {state.activeTab === 'home' && isMobile && !state.ui.sidebarCollapsed && (
          <>
            <div onClick={() => dispatch({ type: 'SET_UI', ui: { sidebarCollapsed: true } })} style={{
              position: 'absolute', inset: 0, background: 'rgba(4,5,7,0.58)', backdropFilter: 'blur(6px)', zIndex: 24,
            }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 25 }}>
              <Sidebar />
            </div>
          </>
        )}
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative', background: 'rgba(8,10,16,0.72)' }}>
          {state.activeTab === 'home' && <ChatView />}
          {state.activeTab === 'studio' && <StudioView />}
          {state.activeTab === 'agent' && <AgentView />}
        </main>
      </div>

      {state.ui.activeModal === 'settings' && <SettingsModal />}
      {state.ui.activeModal === 'pricing' && <PricingModal />}
      {state.ui.activeModal === 'rename' && <RenameModal />}
      {state.ui.activeModal === 'delete' && <DeleteModal />}
      {state.ui.activeModal === 'personalization' && <PersonalizationPanel />}
      <CommandPalette />
      <Toast />
    </div>
  );
}
