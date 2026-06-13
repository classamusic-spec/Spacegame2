import { el } from '../utils/dom';

// An on-screen thumb-stick for touch (also works with mouse). Outputs a
// normalized vector in [-1,1] on each axis. Hidden until a state asks for it.
export class VirtualJoystick {
  readonly root: HTMLElement;
  private base: HTMLElement;
  private knob: HTMLElement;
  private active = false;
  private pointerId = -1;
  private originX = 0;
  private originY = 0;
  private readonly maxDist = 56;

  value = { x: 0, y: 0 };

  constructor(parent: HTMLElement) {
    this.knob = el('div', { class: 'joy-knob' });
    this.base = el('div', { class: 'joy-base' }, [this.knob]);
    this.root = el('div', { class: 'joystick hidden' }, [this.base]);
    parent.append(this.root);

    this.root.addEventListener('pointerdown', this.onDown, { passive: false });
    window.addEventListener('pointermove', this.onMove, { passive: false });
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  show(): void {
    this.root.classList.remove('hidden');
  }
  hide(): void {
    this.root.classList.add('hidden');
    this.reset();
  }

  private onDown = (e: PointerEvent) => {
    e.preventDefault();
    this.active = true;
    this.pointerId = e.pointerId;
    const rect = this.base.getBoundingClientRect();
    this.originX = rect.left + rect.width / 2;
    this.originY = rect.top + rect.height / 2;
    this.updateKnob(e.clientX, e.clientY);
  };

  private onMove = (e: PointerEvent) => {
    if (!this.active || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    this.updateKnob(e.clientX, e.clientY);
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    this.reset();
  };

  private reset(): void {
    this.active = false;
    this.pointerId = -1;
    this.value.x = 0;
    this.value.y = 0;
    this.knob.style.transform = 'translate(0px, 0px)';
  }

  private updateKnob(px: number, py: number): void {
    let dx = px - this.originX;
    let dy = py - this.originY;
    const dist = Math.hypot(dx, dy);
    if (dist > this.maxDist) {
      dx = (dx / dist) * this.maxDist;
      dy = (dy / dist) * this.maxDist;
    }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.value.x = dx / this.maxDist;
    this.value.y = dy / this.maxDist;
  }
}
