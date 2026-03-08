'use client';

import { useState, useEffect } from 'react';
import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/AppShell';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const [entered, setEntered] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('arcus_seen_landing') === 'true';
    } catch {
      return false;
    }
  });
  const [checked, setChecked] = useState(typeof window !== 'undefined');

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChecked(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!checked) return <div style={{ background: '#050505', height: '100vh' }} />;

  if (!entered) return <LandingPage onEnter={() => {
    localStorage.setItem('arcus_seen_landing', 'true');
    setEntered(true);
  }} />;

  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
