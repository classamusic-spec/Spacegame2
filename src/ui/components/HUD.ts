import { el } from '../../utils/dom';

// Persistent heads-up display: star count, an optional context label (current
// planet / activity), and a Back button. States toggle visibility and wire the
// back action as needed.
export class HUD {
  readonly root: HTMLElement;
  private starValue: HTMLElement;
  private starsEl: HTMLElement;
  private label: HTMLElement;
  private backBtn: HTMLButtonElement;
  private actionBtn: HTMLButtonElement;
  private narrationBtn: HTMLButtonElement;
  private onBack: (() => void) | null = null;
  private onAction: (() => void) | null = null;
  private onNarration: (() => void) | null = null;
  private lastStars = 0;

  constructor() {
    this.starValue = el('span', { class: 'hud-star-value', text: '0' });
    this.label = el('div', { class: 'hud-label' });
    this.backBtn = el(
      'button',
      { class: 'hud-back', html: '⬅️', attrs: { 'aria-label': 'Back' } },
      []
    );
    this.backBtn.addEventListener('click', () => this.onBack?.());

    this.actionBtn = el('button', { class: 'hud-action', attrs: { 'aria-label': 'Toggle view' } });
    this.actionBtn.style.display = 'none';
    this.actionBtn.addEventListener('click', () => this.onAction?.());

    this.narrationBtn = el('button', {
      class: 'hud-action hud-narration',
      attrs: { 'aria-label': 'Read aloud on/off' },
    });
    this.narrationBtn.style.display = 'none';
    this.narrationBtn.addEventListener('click', () => this.onNarration?.());

    this.starValue = el('span', { class: 'hud-star-value', text: '0' });
    this.starsEl = el('div', { class: 'hud-stars' }, [
      el('span', { class: 'hud-star-icon', text: '⭐' }),
      this.starValue,
    ]);

    const right = el('div', { class: 'hud-right' }, [this.narrationBtn, this.actionBtn, this.starsEl]);
    this.root = el('div', { class: 'hud hidden' }, [this.backBtn, this.label, right]);
  }

  show(): void {
    this.root.classList.remove('hidden');
  }
  hide(): void {
    this.root.classList.add('hidden');
  }

  setStars(n: number): void {
    this.starValue.textContent = String(n);
    if (n > this.lastStars) {
      // Pop the star counter whenever it grows, for a lively reward feel.
      this.starsEl.classList.remove('bump');
      void this.starsEl.offsetWidth; // restart animation
      this.starsEl.classList.add('bump');
    }
    this.lastStars = n;
  }

  setLabel(text: string): void {
    this.label.textContent = text;
  }

  setBack(handler: (() => void) | null): void {
    this.onBack = handler;
    this.backBtn.style.display = handler ? 'flex' : 'none';
  }

  /** Show the persistent narration (read-aloud) toggle and reflect its state. */
  setNarration(enabled: boolean, handler: () => void): void {
    this.onNarration = handler;
    this.narrationBtn.textContent = enabled ? '🔊' : '🔇';
    this.narrationBtn.classList.toggle('off', !enabled);
    this.narrationBtn.style.display = 'flex';
  }

  /** Show/configure the optional action button (e.g. view toggle). */
  setAction(label: string | null, handler?: () => void): void {
    if (label === null) {
      this.onAction = null;
      this.actionBtn.style.display = 'none';
      return;
    }
    this.actionBtn.textContent = label;
    this.onAction = handler ?? null;
    this.actionBtn.style.display = 'flex';
  }
}
