'use client';

import { useState, useEffect } from 'react';
import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/AppShell';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // If user already has a username, skip landing
    try {
      const raw = localStorage.getItem('arcus_username');
      if (raw && raw !== '""' && raw !== '') {
        setEntered(true);
      }
    } catch {}
    setChecked(true);
  }, []);

  if (!checked) return <div style={{ background: '#050505', height: '100vh' }} />;

  if (!entered) return <LandingPage onEnter={() => setEntered(true)} />;

  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
