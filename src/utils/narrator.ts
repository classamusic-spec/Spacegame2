// Spoken narration via the browser's built-in Web Speech API. No audio assets
// and no network — speech is synthesized on the device, so pre-readers can have
// lessons, questions, and instructions read aloud. A single shared instance is
// used across the app.

function mathToWords(text: string): string {
  // Speak math symbols as words so "2 + 1" reads naturally. Spaces guard the
  // ASCII minus so hyphenated words like "co-op" aren't mangled.
  return text
    .replace(/\s\+\s/g, ' plus ')
    .replace(/\s-\s/g, ' minus ')
    .replace(/×|✖️|✖/g, ' times ')
    .replace(/÷|➗/g, ' divided by ')
    .replace(/\s=\s/g, ' equals ');
}

function sanitize(text: string): string {
  // Strip emoji/pictographs/arrows so they aren't read as gibberish.
  return mathToWords(text)
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}]/gu,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}

class Narrator {
  private enabled = true;
  private voice: SpeechSynthesisVoice | null = null;
  readonly supported: boolean;

  constructor() {
    this.supported =
      typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    if (this.supported) {
      this.pickVoice();
      try {
        window.speechSynthesis.addEventListener('voiceschanged', () => this.pickVoice());
      } catch {
        /* some engines don't fire this; we already picked a default */
      }
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.stop();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private pickVoice(): void {
    if (!this.supported) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    // Prefer a clear US-English voice; fall back to any English, then anything.
    this.voice =
      voices.find((v) => /en[-_]?US/i.test(v.lang) && /female|samantha|google|zira|aria|jenny/i.test(v.name)) ||
      voices.find((v) => /en[-_]?US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0];
  }

  /** Speak text aloud (cancels anything currently speaking). */
  speak(text: string): void {
    if (!this.enabled || !this.supported) return;
    const clean = sanitize(text);
    if (!clean) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    if (this.voice) u.voice = this.voice;
    u.rate = 0.96; // a touch slower for young listeners
    u.pitch = 1.12; // a friendly, slightly higher tone
    u.volume = 1;
    synth.speak(u);
  }

  stop(): void {
    if (this.supported) window.speechSynthesis.cancel();
  }
}

export const narrator = new Narrator();

// Spoken names for the emojis used as picture answers, so the choices can be
// read aloud for pre-readers. Unknown emojis are simply skipped.
const EMOJI_NAMES: Record<string, string> = {
  '🍎': 'apple', '🍌': 'banana', '🥕': 'carrot', '🥦': 'broccoli', '🥖': 'bread',
  '🧀': 'cheese', '🍕': 'pizza', '🍪': 'cookie', '🍭': 'lollipop', '🍬': 'candy',
  '🍰': 'cake', '🍩': 'donut', '🥗': 'salad', '☕': 'cup',
  '🐶': 'dog', '🐱': 'cat', '🐮': 'cow', '🐔': 'chicken', '🐸': 'frog', '🐟': 'fish',
  '🐦': 'bird', '🦅': 'eagle', '🐘': 'elephant', '🐭': 'mouse', '🐰': 'rabbit',
  '🐇': 'rabbit', '🐢': 'turtle', '🐌': 'snail', '🐝': 'bee', '🐜': 'ant', '🐛': 'caterpillar',
  '🦋': 'butterfly', '🦊': 'fox', '🐪': 'camel', '🐳': 'whale', '🐉': 'dragon', '🐴': 'horse',
  '☀️': 'sun', '🌙': 'moon', '⭐': 'star', '🌈': 'rainbow', '❄️': 'snowflake', '🔥': 'fire',
  '🌧️': 'rain', '🌤️': 'sunshine', '💧': 'water drop', '💨': 'wind', '🌊': 'ocean wave',
  '🌍': 'Earth', '🌎': 'Earth', '🪐': 'planet', '🧊': 'ice', '🪨': 'rock', '⛰️': 'mountain',
  '🏝️': 'island', '🏞️': 'park', '🌋': 'volcano',
  '🌳': 'tree', '🌱': 'sprout', '🌻': 'sunflower', '🌷': 'tulip', '🌿': 'leaf', '🍂': 'leaves',
  '⚽': 'ball', '🚗': 'car', '🚌': 'bus', '🚀': 'rocket', '✈️': 'airplane', '🚢': 'boat',
  '🚒': 'fire truck', '🪁': 'kite', '🎈': 'balloon',
  '🏠': 'house', '🏫': 'school', '🏥': 'hospital', '🏪': 'store', '🏬': 'store', '🏢': 'building',
  '🔴': 'red', '🔵': 'blue', '🟢': 'green', '🟡': 'yellow', '🟠': 'orange', '🟣': 'purple',
  '🟥': 'red square', '🟦': 'blue square', '⬛': 'black square', '⭕': 'circle', '🔺': 'triangle', '🔷': 'diamond',
  '😀': 'happy face', '😢': 'sad face', '🙂': 'smile', '🤗': 'hug',
  '🥁': 'drum', '🎸': 'guitar', '🎺': 'trumpet', '🎻': 'violin', '🔔': 'bell', '🎵': 'music note',
  '📖': 'book', '📚': 'books', '📕': 'book', '📜': 'scroll', '✏️': 'pencil', '🖍️': 'crayon',
  '🖌️': 'paintbrush', '🎨': 'paint palette', '📄': 'paper', '🔨': 'hammer', '🧼': 'soap',
  '🪥': 'toothbrush', '🪙': 'coin', '🔑': 'key', '🧦': 'sock', '🧱': 'brick', '🪑': 'chair',
  '🏃': 'running', '🛋️': 'couch', '👀': 'eyes', '👂': 'ear', '👃': 'nose', '🦵': 'leg', '👏': 'clapping',
  '🅰️': 'letter A', '🇺🇸': 'American flag', '🧭': 'compass', '🧲': 'magnet', '🛞': 'wheel', '🖐️': 'hand',
};

export function emojiName(e: string): string | null {
  return EMOJI_NAMES[e] ?? null;
}

/** Build a spoken "Is it X, or Y?" phrase from a question's answers. */
export function answerPhrase(
  answers: { label?: string; image?: string }[],
  style: 'text' | 'picture' | 'number'
): string {
  const toWord = (a: { label?: string; image?: string }): string => {
    if (style === 'picture') return emojiName(a.image ?? '') ?? '';
    const label = a.label ?? '';
    // A label might itself be an emoji (e.g. pattern answers) — speak its name.
    if (label && !/[a-z0-9]/i.test(label)) return emojiName(label) ?? '';
    return label;
  };
  const words = answers.map(toWord).filter(Boolean);
  if (words.length < 2) return '';
  const last = words.pop()!;
  return ` Is it ${words.join(', ')}, or ${last}?`;
}
