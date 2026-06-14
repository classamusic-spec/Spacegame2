import { VirtualJoystick } from './VirtualJoystick';
import { el } from '../utils/dom';

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
  private fireHandlers = new Set<() => void>();
  private canvas: HTMLElement;
  private fireBtn: HTMLButtonElement;
  private boostBtn: HTMLButtonElement;

  constructor(canvas: HTMLElement, uiRoot: HTMLElement) {
    this.canvas = canvas;
    this.joystick = new VirtualJoystick(uiRoot);

    // Vintage arcade action buttons (lower-right). Hidden until a state shows
    // them; used for free-flight shooting/boost in the solar system.
    this.boostBtn = el('button', { class: 'arcade-btn boost', text: 'BOOST', attrs: { 'aria-label': 'Boost' } });
    this.fireBtn = el('button', { class: 'arcade-btn fire', text: 'FIRE', attrs: { 'aria-label': 'Fire' } });
    const pad = el('div', { class: 'arcade-buttons hidden' }, [this.boostBtn, this.fireBtn]);
    uiRoot.append(pad);
    this.buttonPad = pad;

    this.fireBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.fire = true;
      this.fireBtn.classList.add('pressed');
      for (const h of this.fireHandlers) h();
    });
    this.fireBtn.addEventListener('pointerup', () => {
      this.fire = false;
      this.fireBtn.classList.remove('pressed');
    });
    this.boostBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.boostHeld = true;
      this.boostBtn.classList.add('pressed');
    });
    this.boostBtn.addEventListener('pointerup', () => {
      this.boostHeld = false;
      this.boostBtn.classList.remove('pressed');
    });

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private buttonPad: HTMLElement;
  private boostHeld = false;

  /** Show/hide the vintage flight controls (joystick + action buttons). */
  showFlightControls(): void {
    this.joystick.show();
    this.buttonPad.classList.remove('hidden');
  }
  hideFlightControls(): void {
    this.joystick.hide();
    this.buttonPad.classList.add('hidden');
  }

  onTap(handler: (t: TapEvent) => void): () => void {
    this.tapHandlers.add(handler);
    return () => this.tapHandlers.delete(handler);
  }

  /** Subscribe to FIRE-button / Space-key presses (returns an unsubscribe). */
  onFire(handler: () => void): () => void {
    this.fireHandlers.add(handler);
    return () => this.fireHandlers.delete(handler);
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

    this.boost = this.boostHeld || this.keys.has('shift') || this.keys.has('b');
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
    const key = e.key.toLowerCase();
    const wasDown = this.keys.has(key);
    this.keys.add(key);
    // Fire on Space / F / Enter (once per press, ignore auto-repeat).
    if (!wasDown && (key === ' ' || key === 'f' || key === 'enter')) {
      this.fire = true;
      for (const h of this.fireHandlers) h();
    }
  };
  private onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    if (key === ' ' || key === 'f' || key === 'enter') this.fire = false;
  };
}
