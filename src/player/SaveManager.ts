import {
  createDefaultProfile,
  PROFILE_VERSION,
  type PlayerProfile,
} from './PlayerProfile';

const STORAGE_KEY = 'spaceacademy.profile.v1';

// Reads/writes the profile to localStorage with a versioned, fail-safe load:
// anything malformed or from a future/older version falls back to a fresh
// default rather than crashing the game.
export class SaveManager {
  load(): PlayerProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultProfile();
      const data = JSON.parse(raw) as Partial<PlayerProfile>;
      if (!data || data.version !== PROFILE_VERSION) {
        return createDefaultProfile();
      }
      // Merge over defaults so missing fields are backfilled (incl. nested
      // settings, so older saves gain new options like narration).
      const def = createDefaultProfile();
      return {
        ...def,
        ...data,
        settings: { ...def.settings, ...(data.settings ?? {}) },
      } as PlayerProfile;
    } catch {
      return createDefaultProfile();
    }
  }

  save(profile: PlayerProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Storage may be full or blocked (private mode); the game still plays,
      // it just won't persist. Fail quietly.
    }
  }

  reset(): PlayerProfile {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return createDefaultProfile();
  }
}
