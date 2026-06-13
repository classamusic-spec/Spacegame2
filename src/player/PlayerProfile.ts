import type { GradeBand } from '../curriculum/types';
import type { RocketId } from '../config/rockets';

// The persisted player state. Bumping PROFILE_VERSION triggers a migration /
// graceful reset in SaveManager.

export const PROFILE_VERSION = 1;

export interface PlanetProgress {
  unlocked: boolean;
  stars: number;
  questionsAnswered: number;
  subjectsCompleted: string[];
}

export interface PlayerProfile {
  version: number;
  name: string;
  gradeBand: GradeBand;
  rocketId: RocketId;
  totalStars: number;
  badges: string[];
  planetProgress: Record<string, PlanetProgress>;
  /** Ids of lessons the player has finished (for ✓ marks). */
  lessonsCompleted: string[];
  settings: { sfx: boolean; music: boolean };
  /** Whether the player has finished the start/rocket/grade onboarding. */
  onboarded: boolean;
}

export function createDefaultProfile(): PlayerProfile {
  return {
    version: PROFILE_VERSION,
    name: 'Explorer',
    gradeBand: 'k',
    rocketId: 'comet',
    totalStars: 0,
    badges: [],
    planetProgress: {},
    lessonsCompleted: [],
    settings: { sfx: true, music: false },
    onboarded: false,
  };
}

export function getPlanetProgress(profile: PlayerProfile, planetId: string): PlanetProgress {
  let p = profile.planetProgress[planetId];
  if (!p) {
    p = { unlocked: false, stars: 0, questionsAnswered: 0, subjectsCompleted: [] };
    profile.planetProgress[planetId] = p;
  }
  return p;
}
