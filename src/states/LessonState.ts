import type { GameState } from './GameState';
import type { Game } from '../core/Game';
import { el } from '../utils/dom';
import { bigButton } from '../ui/components/Button';
import { QuestionCard } from '../ui/components/QuestionCard';
import { ProgressDots } from '../ui/components/ProgressBar';
import { SUBJECT_ICONS, SUBJECT_LABELS, type Lesson } from '../curriculum/types';
import { PROGRESSION } from '../config/constants';

// Runs a full lesson: first the "teach" cards (an explanation the player steps
// through), then practice questions. Correct answers earn stars; finishing
// marks the lesson complete and shows the reward screen.
export class LessonState implements GameState {
  readonly name = 'lesson';
  private game!: Game;
  private lesson!: Lesson;
  private planet = '';
  private teachIndex = 0;
  private qIndex = 0;
  private correct = 0;

  enter(game: Game, params?: Record<string, unknown>): void {
    this.game = game;
    this.planet = String(params?.planet ?? '');
    const lesson = game.curriculum.lessonById(String(params?.lessonId));
    if (!lesson) {
      game.states.change('solar-system');
      return;
    }
    this.lesson = lesson;
    this.teachIndex = 0;
    this.qIndex = 0;
    this.correct = 0;

    game.input.joystick.hide();
    game.ui.hud.show();
    game.ui.hud.setLabel(`${SUBJECT_LABELS[lesson.subject]} • ${lesson.title}`);
    game.ui.hud.setBack(() => game.states.change('solar-system'));

    this.showTeach();
  }

  private showTeach(): void {
    const card = this.lesson.teach[this.teachIndex];
    const isFirst = this.teachIndex === 0;
    const isLast = this.teachIndex === this.lesson.teach.length - 1;

    const children: HTMLElement[] = [];
    if (isFirst) {
      children.push(
        el('div', { class: 'lesson-badge' }, [
          el('span', { class: 'lesson-badge-icon', text: SUBJECT_ICONS[this.lesson.subject] }),
          el('span', { text: SUBJECT_LABELS[this.lesson.subject] }),
        ]),
        el('h2', { class: 'lesson-title', text: this.lesson.title }),
        el('p', { class: 'lesson-objective', text: this.lesson.objective })
      );
    }
    if (card.image) children.push(el('div', { class: 'teach-image', text: card.image }));
    children.push(el('p', { class: 'teach-text', text: card.text }));
    if (card.example) children.push(el('div', { class: 'teach-example', text: card.example }));

    const next = bigButton(
      isLast ? "Let's Practice!" : 'Next',
      () => this.advanceTeach(),
      { icon: isLast ? '✏️' : '➡️', variant: 'primary' }
    );

    const dots = new ProgressDots(this.lesson.teach.length, this.teachIndex);

    this.game.ui.setPanel(
      el('div', { class: 'screen lesson-screen' }, [
        el('div', { class: 'teach-card' }, children),
        dots.root,
        next,
      ])
    );
  }

  private advanceTeach(): void {
    if (this.teachIndex < this.lesson.teach.length - 1) {
      this.teachIndex += 1;
      this.showTeach();
    } else {
      this.showQuestion();
    }
  }

  private showQuestion(): void {
    const q = this.lesson.questions[this.qIndex];
    const dots = new ProgressDots(this.lesson.questions.length, this.qIndex);
    const card = new QuestionCard(q, (correct) => this.onAnswered(correct));
    this.game.ui.setPanel(
      el('div', { class: 'screen quiz-screen' }, [
        el('div', { class: 'quiz-banner', text: 'Practice Time!' }),
        dots.root,
        card.root,
      ])
    );
  }

  private onAnswered(correct: boolean): void {
    if (!correct) return; // QuestionCard allows retry; advance only when correct
    this.correct += 1;
    this.game.rewards.recordAnswer(this.planet, this.lesson.subject);
    this.game.rewards.awardStars(PROGRESSION.starsPerCorrect, this.planet, this.lesson.subject);
    this.game.ui.toast('+1 ⭐', 'star');

    this.qIndex += 1;
    if (this.qIndex >= this.lesson.questions.length) this.finish();
    else this.showQuestion();
  }

  private finish(): void {
    this.game.rewards.completeLesson(this.lesson.id, this.planet, this.lesson.subject);
    this.game.states.change('reward', {
      stars: this.correct,
      title: 'Lesson Complete!',
      next: 'solar-system',
    });
  }

  exit(): void {
    this.game.ui.hidePanel();
    this.game.ui.hud.setBack(null);
  }

  update(): void {}
}
