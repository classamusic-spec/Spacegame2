import { el } from '../../utils/dom';

// A row of dots showing quiz progress (which question you're on). Friendly and
// glanceable for young kids.
export class ProgressDots {
  readonly root: HTMLElement;

  constructor(total: number, current: number) {
    const dots: HTMLElement[] = [];
    for (let i = 0; i < total; i++) {
      const state = i < current ? 'done' : i === current ? 'active' : '';
      dots.push(el('span', { class: `progress-dot ${state}`, text: i < current ? '⭐' : '' }));
    }
    this.root = el('div', { class: 'progress-dots' }, dots);
  }
}
