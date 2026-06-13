import type { Subject } from '../curriculum/types';

// A planet definition drives both the 3D scene (size, orbit, color) and the
// curriculum hub (which subjects live here, unlock gating). Phase 1 ships the
// Sun + inner planets; outer planets are added in Phase 3.

export interface PlanetDef {
  id: string;
  name: string;
  /** Visual sphere radius in world units. */
  radius: number;
  /** Distance from the Sun (world units). */
  orbitRadius: number;
  /** Radians per second the planet advances along its orbit. */
  orbitSpeed: number;
  /** Base color used for procedural texture + label halo. */
  color: number;
  /** Secondary color for the procedural surface bands. */
  accent: number;
  hasRing: boolean;
  /** Axial tilt in radians, for a touch of realism. */
  tilt: number;
  /** Subjects taught at this planet. */
  subjects: Subject[];
  /** Stars required before this planet unlocks (0 = open from start). */
  unlockStars: number;
  /** Fun one-liner shown on approach. */
  blurb: string;
}

export const PLANETS: PlanetDef[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    radius: 1.1,
    orbitRadius: 26,
    orbitSpeed: 0.05,
    color: 0xb7a99a,
    accent: 0x8a7d6e,
    hasRing: false,
    tilt: 0.02,
    subjects: ['math', 'science'],
    unlockStars: 0,
    blurb: 'The smallest, fastest planet — closest to the Sun!',
  },
  {
    id: 'venus',
    name: 'Venus',
    radius: 1.7,
    orbitRadius: 38,
    orbitSpeed: 0.035,
    color: 0xe8c07a,
    accent: 0xc8923f,
    hasRing: false,
    tilt: 0.05,
    subjects: ['phonics', 'spelling'],
    unlockStars: 5,
    blurb: 'The hottest planet, wrapped in golden clouds.',
  },
  {
    id: 'earth',
    name: 'Earth',
    radius: 1.9,
    orbitRadius: 52,
    orbitSpeed: 0.028,
    color: 0x3a86c8,
    accent: 0x4caf50,
    hasRing: false,
    tilt: 0.41,
    subjects: ['math', 'phonics', 'science', 'geography'],
    unlockStars: 0,
    blurb: 'Our home! Land here to learn about states and more.',
  },
  {
    id: 'mars',
    name: 'Mars',
    radius: 1.5,
    orbitRadius: 66,
    orbitSpeed: 0.022,
    color: 0xc1440e,
    accent: 0x8a3008,
    hasRing: false,
    tilt: 0.44,
    subjects: ['science', 'math', 'history'],
    unlockStars: 10,
    blurb: 'The Red Planet — could robots find water here?',
  },
];

export function getPlanet(id: string): PlanetDef | undefined {
  return PLANETS.find((p) => p.id === id);
}
