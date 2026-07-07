export const PRESET_AVATARS = [
  { id: 'a1', seed: 'Felix',   bg: 'b6e3f4' },
  { id: 'a2', seed: 'Sophia',  bg: 'c0aede' },
  { id: 'a3', seed: 'Alex',    bg: 'ffd5dc' },
  { id: 'a4', seed: 'Marcus',  bg: 'd1d4f9' },
  { id: 'a5', seed: 'Emma',    bg: 'ffdfbf' },
  { id: 'a6', seed: 'Carlos',  bg: 'b2efef' },
  { id: 'a7', seed: 'Lily',    bg: 'f9dbb2' },
  { id: 'a8', seed: 'Jordan',  bg: 'c5f5ca' },
  { id: 'a9', seed: 'Sam',     bg: 'e8d5f5' },
];

const BASE = 'https://api.dicebear.com/9.x/avataaars/svg';

export function presetAvatarUrl(id: string): string {
  const cfg = PRESET_AVATARS.find((a) => a.id === id);
  if (!cfg) return '';
  return `${BASE}?seed=${cfg.seed}&backgroundColor=${cfg.bg}&backgroundType=solid`;
}

/** Returns a renderable URL for any avatarUrl value, or null for gradient/default. */
export function resolveAvatarSrc(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('data:image/')) return avatarUrl;
  if (avatarUrl.startsWith('avatar:')) return presetAvatarUrl(avatarUrl.replace('avatar:', ''));
  return null;
}
