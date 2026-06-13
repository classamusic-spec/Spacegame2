import { el } from '../../utils/dom';
import { Sfx, unlockAudio } from '../../utils/audio';

// A big, tappable button sized for little fingers (min height enforced in CSS).
// Plays a tap sound and unlocks audio on first use.
export function bigButton(
  label: string,
  onClick: () => void,
  opts: { icon?: string; variant?: 'primary' | 'ghost' } = {}
): HTMLButtonElement {
  const children: (HTMLElement | string)[] = [];
  if (opts.icon) children.push(el('span', { class: 'btn-icon', text: opts.icon }));
  children.push(el('span', { class: 'btn-label', text: label }));

  const btn = el(
    'button',
    { class: `big-btn ${opts.variant === 'ghost' ? 'ghost' : 'primary'}` },
    children
  );
  btn.addEventListener('click', () => {
    unlockAudio();
    Sfx.tap();
    onClick();
  });
  return btn;
}
