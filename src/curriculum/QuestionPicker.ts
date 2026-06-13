import type { Question } from './types';
import { shuffle } from '../utils/math';

// Picks the next questions for a quiz or mini-game round: filters by planet /
// grade / subject, avoids repeating within a session, and falls back to nearby
// grade bands so a quiz is never empty for sparsely-populated levels.
export class QuestionPicker {
  private seen = new Set<string>();

  reset(): void {
    this.seen.clear();
  }

  /** Build an ordered list of up to `count` questions. */
  pick(pool: Question[], count: number): Question[] {
    const unseen = pool.filter((q) => !this.seen.has(q.id));
    const ordered = byDifficulty(unseen.length >= count ? unseen : pool);
    const chosen = ordered.slice(0, count);
    for (const q of chosen) this.seen.add(q.id);
    return chosen;
  }

  /** A single random question (used to refill mini-game waves). */
  pickOne(pool: Question[]): Question | null {
    if (pool.length === 0) return null;
    const unseen = pool.filter((q) => !this.seen.has(q.id));
    const source = unseen.length > 0 ? unseen : pool;
    const q = source[Math.floor(Math.random() * source.length)];
    this.seen.add(q.id);
    return q;
  }
}

function byDifficulty(questions: Question[]): Question[] {
  // Shuffle first so same-difficulty questions vary order, then sort easy→hard.
  return shuffle(questions).sort((a, b) => (a.difficulty ?? 1) - (b.difficulty ?? 1));
}
