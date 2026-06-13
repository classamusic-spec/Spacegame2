import {
  GRADE_BANDS,
  SUBJECTS,
  type CurriculumFile,
  type CurriculumManifest,
  type Question,
} from './types';

// Loads curriculum JSON via Vite's glob import (bundled, no network fetch),
// validates each file against the schema, and exposes a flat, queryable list of
// questions. Bad content throws a clear console error and is skipped rather
// than corrupting gameplay.

// Eagerly import every curriculum JSON file at build time.
const files = import.meta.glob('../../data/curriculum/**/*.json', {
  eager: true,
}) as Record<string, { default: unknown }>;

function isValidQuestion(q: any, where: string): q is Question {
  if (!q || typeof q !== 'object') return fail(where, 'not an object');
  if (typeof q.id !== 'string') return fail(where, 'missing id');
  if (!SUBJECTS.includes(q.subject)) return fail(q.id, `bad subject "${q.subject}"`);
  if (!GRADE_BANDS.includes(q.gradeBand)) return fail(q.id, `bad gradeBand "${q.gradeBand}"`);
  if (typeof q.planet !== 'string') return fail(q.id, 'missing planet');
  if (typeof q.prompt !== 'string') return fail(q.id, 'missing prompt');
  if (!['text', 'picture', 'number'].includes(q.answerStyle))
    return fail(q.id, `bad answerStyle "${q.answerStyle}"`);
  if (!Array.isArray(q.answers) || q.answers.length < 2)
    return fail(q.id, 'needs at least 2 answers');
  if (!q.answers.some((a: any) => a.correct === true))
    return fail(q.id, 'no correct answer');
  return true;
}

function fail(where: string, msg: string): false {
  console.error(`[curriculum] skipping question (${where}): ${msg}`);
  return false;
}

export class CurriculumLoader {
  private questions: Question[] = [];
  manifest: CurriculumManifest | null = null;

  load(): void {
    this.questions = [];
    for (const [path, mod] of Object.entries(files)) {
      const data = mod.default as Partial<CurriculumFile> & { entries?: unknown };
      // The manifest (index.json) has no `questions`; capture it separately.
      if (path.endsWith('index.json')) {
        this.manifest = mod.default as CurriculumManifest;
        continue;
      }
      if (!data || !Array.isArray(data.questions)) {
        console.error(`[curriculum] ${path} has no questions array`);
        continue;
      }
      for (const q of data.questions) {
        if (isValidQuestion(q, path)) this.questions.push(q);
      }
    }
    console.info(`[curriculum] loaded ${this.questions.length} questions`);
  }

  all(): Question[] {
    return this.questions;
  }

  /** Questions for a planet + grade band, optionally filtered to one subject. */
  query(planet: string, gradeBand: string, subject?: string): Question[] {
    return this.questions.filter(
      (q) =>
        q.planet === planet &&
        q.gradeBand === gradeBand &&
        (subject ? q.subject === subject : true)
    );
  }

  /** Which subjects actually have content for this planet + grade band. */
  availableSubjects(planet: string, gradeBand: string): string[] {
    const set = new Set<string>();
    for (const q of this.questions) {
      if (q.planet === planet && q.gradeBand === gradeBand) set.add(q.subject);
    }
    return [...set];
  }
}
