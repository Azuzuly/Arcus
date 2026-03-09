import { createClient } from '@insforge/sdk';

const INSFORGE_BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!INSFORGE_BASE_URL || !INSFORGE_ANON_KEY) {
  throw new Error(
    'Missing Insforge configuration. Set NEXT_PUBLIC_INSFORGE_BASE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY in your environment.'
  );
}

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
