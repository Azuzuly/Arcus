'use client';

import { useState, useEffect } from 'react';
import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/AppShell';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setEntered(localStorage.getItem('arcus_seen_landing') === 'true');
      } catch {
        setEntered(false);
      }
      setChecked(true);
    });
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
