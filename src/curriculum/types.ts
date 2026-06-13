// Shared schema for all curriculum content. The JSON files under
// data/curriculum/**/*.json are validated against these shapes at load time
// (see CurriculumLoader), so hand-edited content fails loudly rather than
// silently misbehaving at runtime.

export const GRADE_BANDS = ['toddler', 'prek', 'k', 'g1', 'g2', 'g3'] as const;
export type GradeBand = (typeof GRADE_BANDS)[number];

export const SUBJECTS = [
  'math',
  'science',
  'history',
  'geography',
  'spelling',
  'phonics',
  'reading',
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
  subject: Subject;
  gradeBand: GradeBand;
  planet: string;
  prompt: string;
  /** Optional big picture shown with the prompt for pre-readers. */
  promptImage?: string;
  answerStyle: AnswerStyle;
  answers: Answer[];
  hint?: string;
  difficulty?: number;
}

export interface CurriculumFile {
  planet: string;
  subject: Subject;
  version: number;
  questions: Question[];
}

export interface CurriculumManifestEntry {
  planet: string;
  subject: Subject;
  file: string;
}

export interface CurriculumManifest {
  version: number;
  entries: CurriculumManifestEntry[];
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
  science: 'Science',
  history: 'History',
  geography: 'States & Maps',
  spelling: 'Spelling',
  phonics: 'Phonics',
  reading: 'Reading',
};

export const SUBJECT_ICONS: Record<Subject, string> = {
  math: '➕',
  science: '🔬',
  history: '📜',
  geography: '🗺️',
  spelling: '✏️',
  phonics: '🔤',
  reading: '📖',
};
