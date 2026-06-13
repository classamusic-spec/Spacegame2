import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { GRADE_BANDS, GRADE_BAND_LABELS, type GradeBand } from '../curriculum/types';

const GRADE_ICONS: Record<GradeBand, string> = {
  toddler: '🐣',
  prek: '🧸',
  k: '🎈',
  g1: '1️⃣',
  g2: '2️⃣',
  g3: '3️⃣',
};

// Grade-band picker. Sets the difficulty level of all questions. Re-enterable so
// a parent can re-level the child at any time.
export class GradeSelectState implements GameState {
  readonly name = 'grade-select';
  private game!: Game;

  enter(game: Game): void {
    this.game = game;
    game.ui.hud.hide();
    game.input.joystick.hide();

    const heading = el('h2', { class: 'screen-title', text: 'How old are you?' });
    const sub = el('p', { class: 'screen-sub', text: 'Pick your grade so the questions are just right.' });

    const grid = el('div', { class: 'grade-grid' });
    for (const band of GRADE_BANDS) {
      const selected = game.profile.gradeBand === band;
      const card = el('button', { class: `grade-card ${selected ? 'selected' : ''}` }, [
        el('span', { class: 'grade-icon', text: GRADE_ICONS[band] }),
        el('span', { class: 'grade-name', text: GRADE_BAND_LABELS[band] }),
      ]);
      card.addEventListener('click', () => {
        game.profile.gradeBand = band;
        game.persistProfile();
        game.states.change(game.profile.onboarded ? 'solar-system' : 'rocket-select');
      });
      grid.append(card);
    }

    const back = bigButton('Back', () => game.states.change('start'), {
      icon: '⬅️',
      variant: 'ghost',
    });

    game.ui.setPanel(
      el('div', { class: 'screen center-screen' }, [heading, sub, grid, back])
    );
  }

  exit(): void {
    this.game.ui.hidePanel();
  }

  update(): void {}
}
