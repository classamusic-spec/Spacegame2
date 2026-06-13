// The three player rockets. Each is built procedurally from primitive geometry
// (see scene/entities/Rocket.ts), so there are zero binary model assets to ship
// or license. The config drives the visual style and flavor.

export type RocketId = 'comet' | 'saucer' | 'classic';

export interface RocketDef {
  id: RocketId;
  name: string;
  emoji: string;
  bodyColor: number;
  finColor: number;
  flameColor: number;
  /** Relative handling feel — purely cosmetic flavor text for kids. */
  blurb: string;
}

export const ROCKETS: RocketDef[] = [
  {
    id: 'comet',
    name: 'Comet Racer',
    emoji: '🚀',
    bodyColor: 0xff5a76,
    finColor: 0xffd24a,
    flameColor: 0xffa030,
    blurb: 'Super fast and zippy!',
  },
  {
    id: 'saucer',
    name: 'Star Saucer',
    emoji: '🛸',
    bodyColor: 0x5ad1ff,
    finColor: 0xffffff,
    flameColor: 0x8affff,
    blurb: 'Smooth and easy to steer.',
  },
  {
    id: 'classic',
    name: 'Moon Hopper',
    emoji: '🛰️',
    bodyColor: 0xeeeeee,
    finColor: 0xff5a76,
    flameColor: 0xffd24a,
    blurb: 'A steady, friendly explorer.',
  },
];

export function getRocket(id: RocketId): RocketDef {
  return ROCKETS.find((r) => r.id === id) ?? ROCKETS[0];
}
