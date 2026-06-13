import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { QuestionCard } from '../ui/components/QuestionCard';
import { ProgressDots } from '../ui/components/ProgressBar';
import type { Question, Subject } from '../curriculum/types';
import { SUBJECT_LABELS } from '../curriculum/types';
import { PROGRESSION } from '../config/constants';

// Runs a short quiz (a few questions) for one planet + subject at the player's
// grade band. Correct answers earn stars; finishing hands off to the reward
// screen. Always returns to the solar system afterwards.
export class PlanetQuizState implements GameState {
  readonly name = 'planet-quiz';
  private game!: Game;
  private planet = '';
  private subject: Subject = 'math';
  private questions: Question[] = [];
  private index = 0;
  private correct = 0;
  private dots: ProgressDots | null = null;

  enter(game: Game, params?: Record<string, unknown>): void {
    this.game = game;
    this.planet = String(params?.planet ?? 'earth');
    this.subject = (params?.subject as Subject) ?? 'math';
    this.index = 0;
    this.correct = 0;

    game.input.joystick.hide();
    game.ui.hud.show();
    game.ui.hud.setLabel(SUBJECT_LABELS[this.subject]);
    game.ui.hud.setBack(() => game.states.change('solar-system'));

    const pool = game.curriculum.query(this.planet, game.profile.gradeBand, this.subject);
    game.picker.reset();
    this.questions = game.picker.pick(pool, PROGRESSION.questionsPerQuiz);

    if (this.questions.length === 0) {
      this.showEmpty();
      return;
    }
    this.showQuestion();
  }

  private showEmpty(): void {
    this.game.ui.setPanel(
      el('div', { class: 'screen center-screen' }, [
        el('div', { class: 'arrival-planet', text: '🛰️' }),
        el('p', { class: 'screen-sub', text: 'More questions are on the way for this level!' }),
        bigButton('Back to Space', () => this.game.states.change('solar-system'), {
          icon: '🚀',
        }),
      ])
    );
  }

  private showQuestion(): void {
    const q = this.questions[this.index];
    this.dots = new ProgressDots(this.questions.length, this.index);

    const card = new QuestionCard(q, (correct) => this.onAnswered(correct));
    this.game.ui.setPanel(
      el('div', { class: 'screen quiz-screen' }, [this.dots.root, card.root])
    );
  }

  private onAnswered(correct: boolean): void {
    if (!correct) return; // QuestionCard lets them retry; only advance on correct
    const q = this.questions[this.index];
    this.correct += 1;
    this.game.rewards.recordAnswer(this.planet, q.subject);
    this.game.rewards.awardStars(PROGRESSION.starsPerCorrect, this.planet, q.subject);
    this.game.ui.toast('+1 ⭐', 'star');

    this.index += 1;
    if (this.index >= this.questions.length) {
      this.finish();
    } else {
      this.showQuestion();
    }
  }

  private finish(): void {
    this.game.rewards.completeQuiz(this.planet, this.subject);
    this.game.states.change('reward', {
      planet: this.planet,
      subject: this.subject,
      stars: this.correct,
      next: 'solar-system',
    });
  }

  exit(): void {
    this.game.ui.hidePanel();
    this.game.ui.hud.setBack(null);
  }

  update(): void {}
}
