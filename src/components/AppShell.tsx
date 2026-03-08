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
import Toast from './Toast';
import { fetchModels } from '@/lib/openrouter';
import RenameModal from './RenameModal';
import DeleteModal from './DeleteModal';
import AuroraBackground from './AuroraBackground';

const DEFAULT_ACCENT_RGB = '59, 130, 246';

function hexToRgb(hex: string): string {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized;

  if (value.length !== 6 || !/^[\da-fA-F]{6}$/.test(value)) return DEFAULT_ACCENT_RGB;

  const num = Number.parseInt(value, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

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
      if (mod && e.key === 'n') { e.preventDefault(); dispatch({ type: 'SET_TAB', tab: 'home' }); }
      if (mod && e.key === ',') { e.preventDefault(); dispatch({ type: 'SHOW_MODAL', modal: 'settings' }); }
      if (mod && e.key === '/') { e.preventDefault(); dispatch({ type: 'TOGGLE_SIDEBAR' }); }
      if (e.key === 'Escape') { dispatch({ type: 'HIDE_MODAL' }); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-blue', state.settings.accentColor);
    root.style.setProperty('--accent-blue-glow', `rgba(${hexToRgb(state.settings.accentColor)}, 0.35)`);
  }, [state.settings.accentColor]);

  if (!state.initialized) return <div style={{ background: '#050505', height: '100vh' }} />;

  if (!state.user.username) return <OnboardingFlow />;

  return (
    <div id="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', position: 'relative', background: '#05070D' }}>
      <AuroraBackground />
      <TopNav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
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
      <Toast />
    </div>
  );
}
