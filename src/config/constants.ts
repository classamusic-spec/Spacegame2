// Central tuning knobs. Keeping them here makes the game easy to feel-tune
// without hunting through systems.

export const COLORS = {
  bg: 0x05030f,
  uiAccent: '#ffd24a',
  uiAccent2: '#5ad1ff',
  correct: '#46d369',
  wrong: '#ff5a76',
};

export const FLIGHT = {
  travelDuration: 2.2, // seconds for tap-to-travel auto-flight
  cameraLambda: 3.5, // chase-camera smoothing
  cameraDistance: 14,
  cameraHeight: 6,
};

export const PROGRESSION = {
  starsPerCorrect: 1,
  starsToUnlockNext: 5, // stars needed to unlock the next planet
  questionsPerQuiz: 5,
  ufoQuestionsPerRound: 4,
};

export const RENDER = {
  maxPixelRatio: 2,
  starCount: 2400,
};
