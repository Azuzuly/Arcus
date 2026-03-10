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

/**
 * Build a unique username by appending a short hash derived from userId.
 * This prevents collisions when two users share the same base name.
 */
export function buildUniqueUsername(base: string, userId: string): string {
  const normalizedBase = normalizeUsernameBase(base);

  // Derive a short suffix from the userId to ensure uniqueness
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const suffix = Math.abs(hash).toString(36).slice(0, 4);

  // Truncate base if needed to keep total length reasonable
  const maxBaseLen = 18 - suffix.length - 1;
  const truncatedBase = normalizedBase.slice(0, maxBaseLen);

  return `${truncatedBase}-${suffix}`;
}

export function createGuestUserState() {
  return {
    id: '',
    email: '',
    emailVerified: false,
    username: '',
    apiKey: '',
    tier: 'free' as 'free' | 'pro' | 'owner',
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
    tier: 'free' as 'free' | 'pro' | 'owner',
    avatar: getAvatarInitials(username),
    avatarColor: getAvatarColor(username),
  };
}
