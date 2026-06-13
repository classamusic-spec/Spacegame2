import { el } from '../../utils/dom';
import { Sfx, unlockAudio } from '../../utils/audio';
import { narrator } from '../../utils/narrator';
import type { Answer, Question } from '../../curriculum/types';

/** Read a question + its text/number options aloud (for pre-readers). */
export function narrateQuestion(q: Question): void {
  let text = q.prompt;
  if (q.answerStyle !== 'picture') {
    const opts = q.answers.map((a) => a.label ?? '').filter(Boolean);
    if (opts.length) text += `. Is it ${opts.join(', ')}?`;
  }
  narrator.speak(text);
}

// Renders a single question with big tappable answers. The `answerStyle`
// controls layout: text/number use labeled buttons; picture uses a grid of big
// emoji/image tiles so pre-readers can play without reading. Gives instant
// green/red feedback and reports the result.
export class QuestionCard {
  readonly root: HTMLElement;
  private answered = false;

  constructor(
    private question: Question,
    private onAnswered: (correct: boolean) => void
  ) {
    const speaker = el('button', {
      class: 'speaker-btn',
      text: '🔊',
      attrs: { 'aria-label': 'Hear the question' },
    });
    speaker.addEventListener('click', () => narrateQuestion(question));
    const prompt = el('div', { class: 'q-prompt-row' }, [
      el('div', { class: 'q-prompt', text: question.prompt }),
      speaker,
    ]);

    const promptMedia: HTMLElement[] = [];
    if (question.promptImage) {
      promptMedia.push(el('div', { class: 'q-prompt-image', text: question.promptImage }));
    }

    const answersWrap = el('div', {
      class: `q-answers q-answers-${question.answerStyle}`,
    });
    for (const ans of question.answers) {
      answersWrap.append(this.renderAnswer(ans));
    }

    this.root = el('div', { class: 'question-card' }, [
      ...promptMedia,
      prompt,
      answersWrap,
    ]);

    // Read the question aloud automatically when it appears.
    narrateQuestion(question);
  }

  private renderAnswer(ans: Answer): HTMLElement {
    const isPicture = this.question.answerStyle === 'picture';
    const content = isPicture
      ? el('span', { class: 'ans-image', text: ans.image ?? '❓' })
      : el('span', { class: 'ans-label', text: ans.label ?? '' });

    const btn = el('button', { class: `answer-btn ${isPicture ? 'picture' : ''}` }, [content]);
    btn.addEventListener('click', () => this.handlePick(ans, btn));
    return btn;
  }

  private handlePick(ans: Answer, btn: HTMLElement): void {
    if (this.answered) return;
    unlockAudio();

    if (ans.correct) {
      this.answered = true;
      btn.classList.add('correct');
      Sfx.correct();
      // Reveal disabled state on others.
      this.root.querySelectorAll('.answer-btn').forEach((b) => b.classList.add('locked'));
      btn.classList.remove('locked');
      setTimeout(() => this.onAnswered(true), 700);
    } else {
      // Wrong: gentle shake, no penalty — let them try again.
      btn.classList.add('wrong');
      Sfx.wrong();
      setTimeout(() => btn.classList.remove('wrong'), 500);
      this.onAnswered(false);
    }
  }
}
