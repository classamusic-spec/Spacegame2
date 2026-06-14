import {
  GRADE_BANDS,
  SUBJECTS,
  type GradeBand,
  type Lesson,
  type PracticeItem,
  type Question,
  type Subject,
  type SubjectFile,
} from './types';
import { shuffle } from '../utils/math';

// Loads curriculum JSON via Vite's glob import (bundled, no network fetch),
// validates each subject file against the schema, and exposes lessons + practice
// queries. Bad content logs a clear console error and is skipped rather than
// corrupting gameplay.

const files = import.meta.glob('../../data/curriculum/*.json', {
  eager: true,
}) as Record<string, { default: unknown }>;

function bad(where: string, msg: string): false {
  console.error(`[curriculum] ${where}: ${msg}`);
  return false;
}

function isValidQuestion(q: any, where: string): q is Question {
  if (!q || typeof q !== 'object') return bad(where, 'question not an object');
  if (typeof q.prompt !== 'string') return bad(where, 'question missing prompt');
  if (!['text', 'picture', 'number'].includes(q.answerStyle))
    return bad(where, `bad answerStyle "${q.answerStyle}"`);
  if (!Array.isArray(q.answers) || q.answers.length < 2)
    return bad(where, 'question needs at least 2 answers');
  if (!q.answers.some((a: any) => a.correct === true))
    return bad(where, 'question has no correct answer');
  return true;
}

function isValidLesson(l: any, subject: Subject, where: string): l is Lesson {
  if (!l || typeof l !== 'object') return bad(where, 'lesson not an object');
  if (typeof l.id !== 'string') return bad(where, 'lesson missing id');
  if (!GRADE_BANDS.includes(l.gradeBand)) return bad(l.id, `bad gradeBand "${l.gradeBand}"`);
  if (typeof l.title !== 'string') return bad(l.id, 'lesson missing title');
  if (!Array.isArray(l.teach) || l.teach.length === 0) return bad(l.id, 'lesson needs teach cards');
  if (!Array.isArray(l.questions) || l.questions.length === 0)
    return bad(l.id, 'lesson needs questions');
  // Normalize: ensure subject is set from the file.
  l.subject = subject;
  return l.questions.every((q: any) => isValidQuestion(q, l.id));
}

export class CurriculumLoader {
  private lessons: Lesson[] = [];

  load(): void {
    this.lessons = [];
    for (const [path, mod] of Object.entries(files)) {
      const data = mod.default as Partial<SubjectFile>;
      if (!data || !SUBJECTS.includes(data.subject as Subject)) {
        console.error(`[curriculum] ${path}: missing/invalid subject`);
        continue;
      }
      if (!Array.isArray(data.lessons)) {
        console.error(`[curriculum] ${path}: missing lessons array`);
        continue;
      }
      const subject = data.subject as Subject;
      for (const l of data.lessons) {
        if (isValidLesson(l, subject, path)) this.lessons.push(l as Lesson);
      }
    }
    const qCount = this.lessons.reduce((n, l) => n + l.questions.length, 0);
    console.info(`[curriculum] loaded ${this.lessons.length} lessons, ${qCount} questions`);
  }

  /** Lessons for a subject at a grade band, in authored order. */
  lessonsFor(subject: Subject, gradeBand: GradeBand): Lesson[] {
    return this.lessons.filter((l) => l.subject === subject && l.gradeBand === gradeBand);
  }

  /** Lessons across several subjects at a grade band (a planet may host a few). */
  lessonsForSubjects(subjects: Subject[], gradeBand: GradeBand): Lesson[] {
    return this.lessons.filter(
      (l) => subjects.includes(l.subject) && l.gradeBand === gradeBand
    );
  }

  lessonById(id: string): Lesson | undefined {
    return this.lessons.find((l) => l.id === id);
  }

  /** Which of the given subjects actually have lessons at this grade band. */
  availableSubjects(subjects: Subject[], gradeBand: GradeBand): Subject[] {
    return subjects.filter((s) => this.lessonsFor(s, gradeBand).length > 0);
  }

  /** Flatten practice questions (tagged with subject) for a mini-game round. */
  practiceForSubjects(subjects: Subject[], gradeBand: GradeBand): PracticeItem[] {
    const items: PracticeItem[] = [];
    for (const l of this.lessonsForSubjects(subjects, gradeBand)) {
      for (const q of l.questions) items.push({ question: q, subject: l.subject });
    }
    return items;
  }

  /** All practice questions at a grade band (mini-game fallback). */
  practiceForGrade(gradeBand: GradeBand): PracticeItem[] {
    const items: PracticeItem[] = [];
    for (const l of this.lessons.filter((x) => x.gradeBand === gradeBand)) {
      for (const q of l.questions) items.push({ question: q, subject: l.subject });
    }
    return items;
  }

  /**
   * Build a synthetic "Mixed Review" lesson: a fresh shuffle of questions drawn
   * from a world's lessons at the grade band. Returns null if there isn't
   * enough variety to review.
   */
  buildReview(planetId: string, subjects: Subject[], gradeBand: GradeBand, count = 6): Lesson | null {
    const pool = this.practiceForSubjects(subjects, gradeBand);
    if (pool.length < 3) return null;
    const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
    const questions: Question[] = picked.map((it, i) => ({ ...it.question, id: `rv-${i}` }));
    return {
      id: `review-${planetId}-${gradeBand}`,
      subject: subjects[0],
      gradeBand,
      title: 'Mixed Review',
      objective: 'I can practice everything I have learned in this world!',
      teach: [
        {
          text: "Let's review! Listen to each question and pick the best answer. You've got this!",
          image: '🌟',
        },
      ],
      questions,
    };
  }
}
