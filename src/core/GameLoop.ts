// Drives a single requestAnimationFrame loop, computing a clamped delta time so
// a backgrounded tab doesn't produce a huge jump when it resumes.
export class GameLoop {
  private rafId = 0;
  private last = 0;
  private running = false;

  constructor(private onFrame: (dt: number) => void) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.onFrame(dt);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
