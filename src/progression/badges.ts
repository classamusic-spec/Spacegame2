// Badge definitions — milestone rewards shown on the trophy shelf. Kept
// data-driven so new badges are easy to add.

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'first-flight', name: 'First Flight', icon: '🚀', description: 'Took off on your first journey!' },
  { id: 'first-star', name: 'Star Catcher', icon: '⭐', description: 'Earned your very first star.' },
  { id: 'math-star', name: 'Math Star', icon: '➕', description: 'Answered 5 math questions.' },
  { id: 'phonics-pro', name: 'Phonics Pro', icon: '🔤', description: 'Answered 5 phonics questions.' },
  { id: 'earth-explorer', name: 'Earth Explorer', icon: '🌍', description: 'Completed a quiz on Earth.' },
  { id: 'ufo-buster', name: 'UFO Buster', icon: '🛸', description: 'Won the UFO mini-game.' },
  { id: 'asteroid-blaster', name: 'Asteroid Blaster', icon: '☄️', description: 'Cleared an asteroid field.' },
  { id: 'planet-unlocker', name: 'Trailblazer', icon: '🔓', description: 'Unlocked a new planet.' },
  { id: 'gas-giant', name: 'Giant Explorer', icon: '🪐', description: 'Visited a giant outer planet.' },
  { id: 'reviewer', name: 'Review Star', icon: '🌟', description: 'Completed a Mixed Review.' },
];

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}
