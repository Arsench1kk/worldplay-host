export type GolYaPoochPlayer = {
  id: string;
  name: string;
  score: number;
};

export type GolYaPoochPhase =
  | "intro"
  | "setup"
  | "hide"
  | "guess"
  | "reveal"
  | "round-result"
  | "game-over";

export type GolYaPoochRoundState = {
  roundNumber: number;
  hiderIndex: number;
  secretHand: "left" | "right" | null;
  guesserIndex: number | null;
  guess: "left" | "right" | null;
  correct: boolean;
  clue: string;
};

export type GolYaPoochGameState = {
  phase: GolYaPoochPhase;
  players: GolYaPoochPlayer[];
  round: GolYaPoochRoundState;
  totalRounds: number;
  winner: string | null;
};

export const FALLBACK_CLUES = [
  "The hand is steady... or pretending to be.",
  "A hint from Nika: watch the fingers, not the fist.",
  "In Iran, they say the flower hides where the heart leans.",
  "Trust your instincts, or the table will laugh.",
  "The empty hand waves more than the full one.",
  "No bluff is perfect. Find the seams.",
  "Even the best hiders breathe differently.",
  "The flower rarely stays in the dominant hand.",
  "Look for tension in the wrist, not the palm.",
  "Sometimes the obvious choice hides the truth."
];

export const GAME_INSTRUCTIONS = [
  "One player hides a flower (or small object) in one hand.",
  "The guesser chooses LEFT or RIGHT.",
  "If correct, the guesser scores a point. If wrong, the hider scores.",
  "Take turns being the hider each round.",
  "Play several rounds and see who wins!"
];