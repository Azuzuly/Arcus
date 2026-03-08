'use client';

import { useStore } from '@/lib/store';
import { useEffect } from 'react';
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

export default function AppShell() {
  const { state, dispatch, showToast } = useStore();

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

  if (!state.user.username) return <OnboardingFlow />;

  return (
    <div id="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {state.activeTab === 'home' && <Sidebar />}
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {state.activeTab === 'home' && <ChatView />}
          {state.activeTab === 'studio' && <StudioView />}
          {state.activeTab === 'agent' && <AgentView />}
        </main>
      </div>

      {state.ui.activeModal === 'settings' && <SettingsModal />}
      {state.ui.activeModal === 'pricing' && <PricingModal />}
      {state.ui.activeModal === 'rename' && <RenameModal />}
      {state.ui.activeModal === 'delete' && <DeleteModal />}
      <CommandPalette />
      <Toast />
    </div>
  );
}
