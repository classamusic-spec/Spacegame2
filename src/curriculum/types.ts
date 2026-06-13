// Shared schema for all curriculum content. Content is now organized as real
// LESSONS: each lesson teaches a concept (a few "teach" cards) and then offers
// practice questions. Lessons are grouped by subject and grade band, forming a
// coherent school curriculum. The space map is the navigation layer — each
// planet is a "subject world".
//
// The JSON files under data/curriculum/*.json are validated against these
// shapes at load time (see CurriculumLoader), so hand-edited content fails
// loudly rather than silently misbehaving at runtime.

export const GRADE_BANDS = ['toddler', 'prek', 'k', 'g1', 'g2', 'g3'] as const;
export type GradeBand = (typeof GRADE_BANDS)[number];

export const SUBJECTS = [
  'math',
  'reading',
  'phonics',
  'spelling',
  'grammar',
  'science',
  'history',
  'geography',
  'arts',
  'music',
  'health',
] as const;
export type Subject = (typeof SUBJECTS)[number];

export type AnswerStyle = 'text' | 'picture' | 'number';

export interface Answer {
  id: string;
  /** Text label (text/number styles). */
  label?: string;
  /** Emoji or image used for picture answers (great for pre-readers). */
  image?: string;
  correct: boolean;
}

export interface Question {
  id: string;
  prompt: string;
  /** Optional big picture/emoji shown with the prompt for pre-readers. */
  promptImage?: string;
  answerStyle: AnswerStyle;
  answers: Answer[];
  hint?: string;
}

/** One screen of teaching content shown before practice. */
export interface TeachCard {
  /** The explanation, shown big and (in a later phase) read aloud. */
  text: string;
  /** An emoji/illustration that reinforces the idea. */
  image?: string;
  /** An optional worked example or memorable line. */
  example?: string;
}

export interface Lesson {
  id: string;
  subject: Subject;
  gradeBand: GradeBand;
  /** Short lesson name, e.g. "Adding Within 10". */
  title: string;
  /** "I can…" learning goal in kid-friendly language. */
  objective: string;
  teach: TeachCard[];
  questions: Question[];
}

export interface SubjectFile {
  subject: Subject;
  version: number;
  lessons: Lesson[];
}

/** A practice question paired with the subject it came from (for scoring). */
export interface PracticeItem {
  question: Question;
  subject: Subject;
}

export const GRADE_BAND_LABELS: Record<GradeBand, string> = {
  toddler: 'Little Explorer',
  prek: 'Pre-K',
  k: 'Kindergarten',
  g1: '1st Grade',
  g2: '2nd Grade',
  g3: '3rd Grade',
};

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'Math',
  reading: 'Reading',
  phonics: 'Phonics',
  spelling: 'Spelling',
  grammar: 'Grammar & Writing',
  science: 'Science',
  history: 'History',
  geography: 'Geography',
  arts: 'Art',
  music: 'Music',
  health: 'Health',
};

export const SUBJECT_ICONS: Record<Subject, string> = {
  math: '➕',
  reading: '📖',
  phonics: '🔤',
  spelling: '✏️',
  grammar: '🖊️',
  science: '🔬',
  history: '📜',
  geography: '🗺️',
  arts: '🎨',
  music: '🎵',
  health: '🍎',
};
