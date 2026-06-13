import { el, clear } from '../utils/dom';
import { HUD } from './components/HUD';

// Manages the DOM overlay above the WebGL canvas. States push their screen
// markup into the `panel` layer; the HUD and a transient toast layer sit above
// everything. The virtual joystick (added by InputManager) lives here too.
export class UIRoot {
  readonly root: HTMLElement;
  readonly panel: HTMLElement; // full-screen screen content (start, quiz, etc.)
  readonly overlay: HTMLElement; // transient toasts / bursts
  readonly hud: HUD;

  constructor(root: HTMLElement) {
    this.root = root;
    this.panel = el('div', { class: 'panel-layer' });
    this.overlay = el('div', { class: 'overlay-layer' });
    this.hud = new HUD();
    this.root.append(this.panel, this.hud.root, this.overlay);
  }

  /** Replace the full-screen panel content; returns the container to fill. */
  setPanel(...children: HTMLElement[]): HTMLElement {
    clear(this.panel);
    this.panel.classList.remove('hidden');
    for (const c of children) this.panel.append(c);
    return this.panel;
  }

  hidePanel(): void {
    clear(this.panel);
    this.panel.classList.add('hidden');
  }

  /** Show a short celebratory toast (e.g. "+1 ⭐" or "New badge!"). */
  toast(text: string, kind: 'star' | 'badge' | 'info' = 'info'): void {
    const t = el('div', { class: `toast toast-${kind}`, text });
    this.overlay.append(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 400);
    }, 1800);
  }
}
