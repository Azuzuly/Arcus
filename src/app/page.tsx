'use client';

import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
