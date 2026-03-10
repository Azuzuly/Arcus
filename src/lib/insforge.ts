import { createClient } from '@insforge/sdk';

let _client: ReturnType<typeof createClient> | null = null;

function getInsforgeClient() {
  if (_client) return _client;

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    if (typeof window === 'undefined') {
      // During build / SSG — return a dummy that will never be called
      return null as unknown as ReturnType<typeof createClient>;
    }
    throw new Error(
      'Missing Insforge configuration. Set NEXT_PUBLIC_INSFORGE_BASE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY in your environment.'
    );
  }

  _client = createClient({ baseUrl, anonKey });
  return _client;
}

export const insforge = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop, receiver) {
    const client = getInsforgeClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
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
