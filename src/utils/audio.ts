// Lightweight SFX using the Web Audio API with synthesized tones, so the
// vertical slice ships with zero audio assets. Spoken narration arrives in a
// later phase; this module is the seam where it will plug in.

let ctx: AudioContext | null = null;
let enabled = true;

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** The shared AudioContext (used by SFX and background music). */
export function getAudioContext(): AudioContext | null {
  return audioCtx();
}

/** Browsers require a user gesture before audio can play; call on first tap. */
export function unlockAudio(): void {
  const c = audioCtx();
  if (c && c.state === 'suspended') c.resume();
}

export function setSfxEnabled(on: boolean): void {
  enabled = on;
}

function tone(freq: number, duration: number, type: OscillatorType, gain = 0.15): void {
  if (!enabled) return;
  const c = audioCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const Sfx = {
  tap: () => tone(440, 0.08, 'triangle', 0.1),
  correct: () => {
    tone(660, 0.12, 'sine', 0.18);
    setTimeout(() => tone(880, 0.18, 'sine', 0.18), 90);
  },
  wrong: () => tone(180, 0.22, 'sawtooth', 0.12),
  laser: () => tone(900, 0.12, 'square', 0.08),
  explode: () => tone(120, 0.3, 'sawtooth', 0.14),
  whoosh: () => tone(300, 0.4, 'sine', 0.08),
  star: () => {
    tone(784, 0.1, 'sine', 0.16);
    setTimeout(() => tone(1047, 0.2, 'sine', 0.16), 80);
  },
};
