import type { PracticeItem } from './types';
import { shuffle } from '../utils/math';

// Picks practice questions for a mini-game round: avoids repeating within a
// session and shuffles for variety. Lessons play their own questions in order,
// so this is used by the shooting mini-games.
export class QuestionPicker {
  private seen = new Set<string>();

  reset(): void {
    this.seen.clear();
  }

  /** Up to `count` items, preferring ones not yet seen this session. */
  pick(pool: PracticeItem[], count: number): PracticeItem[] {
    const unseen = pool.filter((i) => !this.seen.has(i.question.id));
    const source = shuffle(unseen.length >= count ? unseen : pool);
    const chosen = source.slice(0, count);
    for (const i of chosen) this.seen.add(i.question.id);
    return chosen;
  }
}
