import { createClient } from '@insforge/sdk';

const VERIFIED_INSFORGE_BASE_URL = 'https://gya2dd4j.us-east.insforge.app';
const VERIFIED_INSFORGE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk2Mjh9.qaZ284slgL3D9KkZ_u9C1PUMJ4M6upi8jwuWoiCdeec';

const INSFORGE_BASE_URL = VERIFIED_INSFORGE_BASE_URL;
const INSFORGE_ANON_KEY = VERIFIED_INSFORGE_ANON_KEY;

export const insforge = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

type InternalSession = {
  accessToken: string;
  user: unknown;
};

type InternalInsforgeClient = {
  tokenManager?: {
    mode?: 'memory' | 'storage';
    getSession?: () => InternalSession | null;
    saveSession?: (session: InternalSession) => void;
    setStorageMode?: () => void;
  };
  getHttpClient?: () => {
    setAuthToken: (token: string | null) => void;
  };
};

function isHostedInsforgeOrigin() {
  if (typeof window === 'undefined') return false;

  const { hostname, port, protocol } = window.location;
  if (hostname === 'localhost' && port === '7130') return true;
  return protocol === 'https:' && hostname.endsWith('.insforge.app');
}

export function persistInsforgeSessionLocally() {
  if (typeof window === 'undefined' || isHostedInsforgeOrigin()) return false;

  const client = insforge as unknown as InternalInsforgeClient;
  const tokenManager = client.tokenManager;
  const session = tokenManager?.getSession?.();

  if (!tokenManager || !session?.accessToken || !session.user) return false;

  tokenManager.setStorageMode?.();
  tokenManager.saveSession?.(session);
  client.getHttpClient?.().setAuthToken(session.accessToken);
  return true;
}
