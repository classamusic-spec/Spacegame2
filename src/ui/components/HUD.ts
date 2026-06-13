import { el } from '../../utils/dom';

// Persistent heads-up display: star count, an optional context label (current
// planet / activity), and a Back button. States toggle visibility and wire the
// back action as needed.
export class HUD {
  readonly root: HTMLElement;
  private starValue: HTMLElement;
  private label: HTMLElement;
  private backBtn: HTMLButtonElement;
  private onBack: (() => void) | null = null;

  constructor() {
    this.starValue = el('span', { class: 'hud-star-value', text: '0' });
    this.label = el('div', { class: 'hud-label' });
    this.backBtn = el(
      'button',
      { class: 'hud-back', html: '⬅️', attrs: { 'aria-label': 'Back' } },
      []
    );
    this.backBtn.addEventListener('click', () => this.onBack?.());

    const stars = el('div', { class: 'hud-stars' }, [
      el('span', { class: 'hud-star-icon', text: '⭐' }),
      this.starValue,
    ]);

    this.root = el('div', { class: 'hud hidden' }, [this.backBtn, this.label, stars]);
  }

  show(): void {
    this.root.classList.remove('hidden');
  }
  hide(): void {
    this.root.classList.add('hidden');
  }

  setStars(n: number): void {
    this.starValue.textContent = String(n);
  }

  setLabel(text: string): void {
    this.label.textContent = text;
  }

  setBack(handler: (() => void) | null): void {
    this.onBack = handler;
    this.backBtn.style.display = handler ? 'flex' : 'none';
  }
}
