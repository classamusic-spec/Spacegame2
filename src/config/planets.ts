import type { Subject } from '../curriculum/types';
import type { PlanetVisual } from '../scene/textures';

// A planet definition drives both the 3D scene (size, orbit, look) and the
// curriculum hub (which subjects live here, unlock gating).

export interface PlanetDef {
  id: string;
  name: string;
  /** Visual sphere radius in world units. */
  radius: number;
  /** Distance from the Sun (world units). */
  orbitRadius: number;
  /** Radians per second the planet advances along its orbit. */
  orbitSpeed: number;
  /** Base surface color. */
  color: number;
  /** Secondary color for surface detail / bands. */
  accent: number;
  /** Surface style for the procedural texture. */
  visual: PlanetVisual;
  /** Optional atmospheric halo color (adds a soft glowing rim). */
  atmosphere?: number;
  /** Earthlike planets get a drifting cloud layer. */
  clouds?: boolean;
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
    accent: 0x6f6358,
    visual: 'rocky',
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
    accent: 0xf3e0a8,
    visual: 'ice',
    atmosphere: 0xffd98a,
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
    color: 0x2f6fb0,
    accent: 0x3f9a48,
    visual: 'earthlike',
    atmosphere: 0x66b3ff,
    clouds: true,
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
    accent: 0x7a2a08,
    visual: 'rocky',
    atmosphere: 0xff7a4a,
    hasRing: false,
    tilt: 0.44,
    subjects: ['science', 'math', 'history'],
    unlockStars: 10,
    blurb: 'The Red Planet — could robots find water here?',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    radius: 4.6,
    orbitRadius: 98,
    orbitSpeed: 0.014,
    color: 0xc9a87a,
    accent: 0x9b6b3f,
    visual: 'gas',
    atmosphere: 0xe0b487,
    hasRing: false,
    tilt: 0.05,
    subjects: ['math', 'science'],
    unlockStars: 15,
    blurb: 'The GIANT! It has a storm bigger than Earth.',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    radius: 4.0,
    orbitRadius: 124,
    orbitSpeed: 0.011,
    color: 0xe3d2a0,
    accent: 0xb89b63,
    visual: 'gas',
    atmosphere: 0xf0e2b0,
    hasRing: true,
    tilt: 0.47,
    subjects: ['science', 'reading'],
    unlockStars: 22,
    blurb: 'Famous for its beautiful icy rings!',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    radius: 2.8,
    orbitRadius: 148,
    orbitSpeed: 0.008,
    color: 0x9fe0e6,
    accent: 0xd6f6f8,
    visual: 'ice',
    atmosphere: 0xbff2f6,
    hasRing: false,
    tilt: 1.7,
    subjects: ['science', 'spelling'],
    unlockStars: 30,
    blurb: 'The tilted ice giant that spins on its side!',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    radius: 2.7,
    orbitRadius: 170,
    orbitSpeed: 0.006,
    color: 0x3b62d6,
    accent: 0x6f8ff0,
    visual: 'ice',
    atmosphere: 0x6f8ff0,
    hasRing: false,
    tilt: 0.49,
    subjects: ['science', 'math'],
    unlockStars: 38,
    blurb: 'The windiest, farthest big planet — deep blue!',
  },
];

export function getPlanet(id: string): PlanetDef | undefined {
  return PLANETS.find((p) => p.id === id);
}

/** World radius that comfortably contains the whole system (for free-fly bounds). */
export const SYSTEM_RADIUS = 200;
