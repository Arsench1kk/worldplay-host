export type TheHatPhase =
  | "intro"
  | "setup"
  | "turn-explain"
  | "turn-guess"
  | "scoring"
  | "game-over";

export type TheHatTeam = {
  id: string;
  name: string;
  score: number;
};

export type TheHatTurnState = {
  turnNumber: number;
  totalTurns: number;
  currentWord: string | null;
  wordIndex: number;
  correctCount: number;
  skipCount: number;
  explainerTeamId: string;
  guesserTeamId: string;
};

export type TheHatGameState = {
  phase: TheHatPhase;
  teams: TheHatTeam[];
  turn: TheHatTurnState;
  deck: string[];
};

export type TheHatEvent =
  | { kind: "correct"; word: string; teamId: string }
  | { kind: "skip"; word: string; teamId: string }
  | { kind: "turn-start"; turn: number; explainerTeam: string; guesserTeam: string }
  | { kind: "game-over"; winner: string; scores: Record<string, number> };

export const WORD_DECK_FALLBACK = [
  "bicycle",
  "penguin",
  "volcano",
  "umbrella",
  "airplane",
  "bamboo",
  "treasure",
  "whisper",
  "crystal",
  "lantern",
  "compass",
  "shadow",
  "thunder",
  "diamond",
  "glacier",
  "canyon",
  "island",
  "forest",
  "desert",
  "bridge",
  "castle",
  "rocket",
  "pirate",
  "dragon",
  "wizard",
  "mermaid",
  "rainbow",
  "tornado",
  "sunrise",
  "waterfall",
  "mountain",
  "ocean",
  "jungle",
  "harbor",
  "market",
  "library",
  "museum",
  "stadium",
  "airport",
  "train station",
  "zoo",
  "circus",
  "carnival",
  "festival",
  "wedding",
  "birthday",
  "camping",
  "sailing",
  "surfing",
  "skiing",
  "dancing",
  "cooking",
  "painting",
  "fishing",
  "gardening",
  "building",
  "inventing",
  "exploring",
  "traveling",
  "photography",
  "magic",
  "sculpture",
  "architecture",
  "engineering",
];

export const GAME_INSTRUCTIONS = [
  "Split into two teams.",
  "The explainer sees the secret word and describes it — no saying the word itself!",
  "The guessing team calls out guesses.",
  "Press CORRECT when the word is guessed (+1 point for your team).",
  "Press SKIP to move to the next word (no penalty).",
  "Teams take turns as explainer. Most points wins!",
];

export const HOST_INTRO_LINES = [
  "Welcome to The Hat — describe, guess, and score!",
  "An AI-generated word is waiting. Can your team guess it from clues alone?",
  "The clock is ticking. Be quick, be clear, and have fun!",
];

export const CORRECT_LINES = [
  "Got it! +1 point!",
  "Yes! That's the word!",
  "Perfect! Keep going!",
];

export const SKIP_LINES = [
  "Moving on...",
  "Let's see the next one.",
  "No worries, next word!",
];

export const EXPLAINER_LINES = [
  "Give clear clues — but never say the word itself!",
  "Think of synonyms, actions, or associations.",
  "Be creative with your descriptions!",
];

export const AI_GUESS_LINES = [
  "Hmm... is it a 'bicycle'?",
  "Could this be 'treasure'?",
  "My guess: 'lantern'",
  "I'm thinking 'crystal'.",
  "How about 'volcano'?",
];