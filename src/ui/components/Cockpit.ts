import { el } from '../../utils/dom';
import type { RocketId } from '../../config/rockets';

// A first-person cockpit overlay drawn entirely in CSS. It frames the 3D view
// through a canopy "window" (the surrounding interior is painted by a huge
// box-shadow on the window element) and adds a glowing dashboard, dials, and a
// targeting reticle. Two styles: a rocket flight deck, and a UFO glass dome.
// pointer-events stay off so taps fall through to the 3D world.
export class Cockpit {
  readonly root: HTMLElement;

  constructor(parent: HTMLElement, rocketId: RocketId) {
    const style = rocketId === 'saucer' ? 'saucer' : 'rocket';
    this.root =
      style === 'saucer' ? this.buildSaucer() : this.buildRocket();
    this.root.classList.add('hidden');
    // Insert as the first child so the cockpit sits above the canvas but BELOW
    // the menus / HUD / dock (which are later siblings).
    parent.insertBefore(this.root, parent.firstChild);
  }

  private dials(count: number, cls: string): HTMLElement[] {
    return Array.from({ length: count }, (_, i) =>
      el('span', { class: `${cls} d${(i % 4) + 1}` })
    );
  }

  private buildRocket(): HTMLElement {
    const reticle = el('div', { class: 'ck-reticle' }, [
      el('span', { class: 'ck-reticle-ring' }),
      el('span', { class: 'ck-reticle-dot' }),
    ]);
    const canopy = el('div', { class: 'ck-canopy' }, [
      el('span', { class: 'ck-strut' }),
      reticle,
    ]);
    const dash = el('div', { class: 'ck-dash' }, [
      el('div', { class: 'ck-dash-cluster left' }, this.dials(4, 'ck-dial')),
      el('div', { class: 'ck-throttle' }, [el('span', { class: 'ck-throttle-knob' })]),
      el('div', { class: 'ck-dash-cluster right' }, this.dials(4, 'ck-led')),
    ]);
    return el('div', { class: 'cockpit cockpit-rocket' }, [canopy, dash]);
  }

  private buildSaucer(): HTMLElement {
    const reticle = el('div', { class: 'ck-reticle' }, [
      el('span', { class: 'ck-reticle-ring' }),
      el('span', { class: 'ck-reticle-dot' }),
    ]);
    const dome = el('div', { class: 'ck-dome' }, [
      el('span', { class: 'ck-glass-streak' }),
      reticle,
    ]);
    const rim = el('div', { class: 'ck-rim' }, this.dials(12, 'ck-orb'));
    const console = el('div', { class: 'ck-console' }, [
      el('div', { class: 'ck-console-cluster' }, this.dials(6, 'ck-orb')),
    ]);
    return el('div', { class: 'cockpit cockpit-saucer' }, [dome, rim, console]);
  }

  show(): void {
    this.root.classList.remove('hidden');
  }
  hide(): void {
    this.root.classList.add('hidden');
  }

  destroy(): void {
    this.root.remove();
  }
}
