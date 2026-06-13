import { getAudioContext } from './audio';

// Gentle, procedural "space" background music — no audio assets, generated live
// with the Web Audio API. A slow, breathing chord pad sits under sparse, soft
// twinkle notes drawn from a pentatonic scale, so it stays calm and never feels
// repetitive. Shares the app's AudioContext (unlocked on first tap).

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0]; // C D E G A
const PAD_CHORD = [130.81, 196.0, 261.63, 329.63]; // C3 G3 C4 E4 — open, warm

class SpaceMusic {
  private enabled = false;
  private running = false;
  private master: GainNode | null = null;
  private padOsc: OscillatorNode[] = [];
  private nodes: AudioNode[] = [];
  private twinkleTimer: number | null = null;

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (on) this.start();
    else this.stop();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Build and start the ambient bed (safe to call repeatedly). */
  start(): void {
    if (this.running || !this.enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.running = true;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 4); // slow fade-in
    master.connect(ctx.destination);
    this.master = master;

    // Warm, filtered pad chord.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.6;
    filter.connect(master);
    this.nodes.push(filter);

    // Slow LFO opens/closes the filter for a breathing feel.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.nodes.push(lfo, lfoGain);

    for (const freq of PAD_CHORD) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      // A second slightly detuned oscillator per voice for a richer pad.
      const det = ctx.createOscillator();
      det.type = 'triangle';
      det.frequency.value = freq * 1.005;
      const voice = ctx.createGain();
      voice.gain.value = 0.16;
      osc.connect(voice);
      det.connect(voice);
      voice.connect(filter);
      osc.start();
      det.start();
      this.padOsc.push(osc, det);
      this.nodes.push(voice);
    }

    this.scheduleTwinkle();
  }

  private scheduleTwinkle(): void {
    // Recurring soft note; only sounds when the context is actually running.
    const tick = () => {
      const ctx = getAudioContext();
      if (this.running && this.enabled && ctx && ctx.state === 'running' && this.master) {
        if (Math.random() < 0.75) this.twinkle(ctx);
      }
      const next = 1800 + Math.random() * 2600;
      this.twinkleTimer = window.setTimeout(tick, next);
    };
    this.twinkleTimer = window.setTimeout(tick, 1500);
  }

  private twinkle(ctx: AudioContext): void {
    const base = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    const freq = base * (Math.random() < 0.5 ? 1 : 2); // sometimes an octave up
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner?.();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.4); // soft attack
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2); // long decay
    osc.connect(g);
    if (pan) {
      pan.pan.value = Math.random() * 1.6 - 0.8;
      g.connect(pan);
      pan.connect(this.master!);
    } else {
      g.connect(this.master!);
    }
    osc.start();
    osc.stop(ctx.currentTime + 3.4);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.twinkleTimer !== null) {
      clearTimeout(this.twinkleTimer);
      this.twinkleTimer = null;
    }
    const ctx = getAudioContext();
    const master = this.master;
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2); // fade out
    }
    const toStop = [...this.padOsc];
    const toDisconnect = [master, ...this.nodes];
    setTimeout(() => {
      for (const o of toStop) {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
      }
      for (const n of toDisconnect) {
        try {
          n?.disconnect();
        } catch {
          /* ignore */
        }
      }
    }, 1400);
    this.padOsc = [];
    this.nodes = [];
    this.master = null;
  }
}

export const music = new SpaceMusic();
