import { VirtualJoystick } from './VirtualJoystick';

// Normalizes touch + mouse + keyboard into device-agnostic state that game
// states read each frame. Tap events (for raycasting planets / answers / UFOs)
// are delivered via a subscribable callback so they aren't missed between
// frames.

export interface TapEvent {
  /** Normalized device coords in [-1,1], y-up, for Three raycasting. */
  ndcX: number;
  ndcY: number;
  clientX: number;
  clientY: number;
}

export class InputManager {
  joystick: VirtualJoystick;

  /** Continuous movement/aim vector, -1..1 per axis (joystick or keys). */
  readonly move = { x: 0, y: 0 };
  /** Held action flags. */
  boost = false;
  fire = false;
  /** Latest pointer position in NDC, for aim reticles. */
  readonly pointer = { ndcX: 0, ndcY: 0 };

  private keys = new Set<string>();
  private tapHandlers = new Set<(t: TapEvent) => void>();
  private canvas: HTMLElement;

  constructor(canvas: HTMLElement, uiRoot: HTMLElement) {
    this.canvas = canvas;
    this.joystick = new VirtualJoystick(uiRoot);

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  onTap(handler: (t: TapEvent) => void): () => void {
    this.tapHandlers.add(handler);
    return () => this.tapHandlers.delete(handler);
  }

  /** Call once per frame to fold keyboard + joystick into `move`. */
  update(): void {
    let kx = 0;
    let ky = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) kx -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) kx += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) ky -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) ky += 1;

    // Joystick takes precedence when engaged, else fall back to keys.
    const j = this.joystick.value;
    this.move.x = j.x !== 0 || j.y !== 0 ? j.x : kx;
    this.move.y = j.x !== 0 || j.y !== 0 ? j.y : ky;

    this.boost = this.keys.has(' ') || this.keys.has('shift');
  }

  private toEvent(e: PointerEvent): TapEvent {
    const rect = this.canvas.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    return { ndcX, ndcY, clientX: e.clientX, clientY: e.clientY };
  }

  private onPointerDown = (e: PointerEvent) => {
    const t = this.toEvent(e);
    this.pointer.ndcX = t.ndcX;
    this.pointer.ndcY = t.ndcY;
    for (const h of this.tapHandlers) h(t);
  };

  private onPointerMove = (e: PointerEvent) => {
    const t = this.toEvent(e);
    this.pointer.ndcX = t.ndcX;
    this.pointer.ndcY = t.ndcY;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase());
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
}
