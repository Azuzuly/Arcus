import { getAvatarColor, getAvatarInitials } from './utils';

type InsforgeProfile = Record<string, unknown> | null | undefined;

export interface InsforgeUserLike {
  id: string;
  email?: string;
  emailVerified?: boolean;
  profile?: InsforgeProfile;
}

export function normalizeUsernameBase(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18);

  return normalized || 'arcus';
}

export function buildUniqueUsername(base: string, userId: string): string {
  void userId;
  return normalizeUsernameBase(base);
}

export function createGuestUserState() {
  return {
    id: '',
    email: '',
    emailVerified: false,
    username: '',
    apiKey: '',
    tier: 'free' as const,
    avatar: '',
    avatarColor: '#3B82F6',
  };
}

export function mapInsforgeUserToStateUser(user: InsforgeUserLike) {
  const profile = (user.profile || {}) as Record<string, unknown>;
  const username = String(profile.username || profile.name || user.email?.split('@')[0] || 'arcus');

  return {
    id: user.id,
    email: user.email || '',
    emailVerified: Boolean(user.emailVerified),
    username,
    apiKey: '',
    tier: 'free' as const,
    avatar: getAvatarInitials(username),
    avatarColor: getAvatarColor(username),
  };
}
