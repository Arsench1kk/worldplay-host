export type AdedonhaPhase =
  | "intro"
  | "playing"
  | "stopped"
  | "scoring"
  | "game-over";

export type AdedonhaPlayer = {
  id: string;
  name: string;
  score: number;
};

export type AdedonhaAnswer = {
  playerId: string;
  answer: string;
  valid: boolean;
};

export type AdedonhaRoundState = {
  roundNumber: number;
  letter: string;
  answers: Record<string, string>; // playerId -> answer text
  stoppedBy: string | null; // playerId who called stop
  stoppedAt: number | null; // ms elapsed when stop was called
};

export type AdedonhaGameState = {
  phase: AdedonhaPhase;
  players: AdedonhaPlayer[];
  round: AdedonhaRoundState;
  totalRounds: number;
  roundScores: Record<string, number>; // playerId -> round score
};

export const CATEGORIES = [
  "Animal",
  "Country",
  "Food",
  "Name",
  "Thing",
];

export const GAME_INSTRUCTIONS = [
  "A random LETTER is chosen.",
  "Each player races to write ONE word per CATEGORY starting with that letter.",
  "Anyone can call STOP when they have all categories — but others may keep writing!",
  "When STOP is called, all answers are locked. Scores are revealed.",
  "Points: filled answer +10, duplicate/empty +0.",
  "Play several rounds and see who wins!"
];

export const HOST_INTRO_LINES = [
  "A letter is coming. Be fast, be creative, and watch for the STOP!",
  "From Brazil — the fastest thinking game on the table.",
  "In Adedonha, hesitation loses. Speed wins.",
];

export const STOP_LINES = [
  "STOP called! No more writing!",
  "Nobody moves! The clock has stopped!",
  "Time's up! Put down your pens!",
];

export const SCORE_REVEAL_LINES = [
  "Let's see what everyone wrote!",
  "Reveal your answers! Let's score!",
  "No take-backs! Here come the scores!",
];

const LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "V", "W", "Y", "Z",
];

export function pickRandomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

export function scoreAnswers(
  answers: Record<string, string>,
  allPlayerIds: string[]
): Record<string, number> {
  const scores: Record<string, number> = {};
  const answerGroups: Record<string, string[]> = {};

  for (const playerId of allPlayerIds) {
    const ans = (answers[playerId] ?? "").trim();
    if (!ans) {
      scores[playerId] = 0;
      continue;
    }
    const lower = ans.toLowerCase();
    if (!answerGroups[lower]) answerGroups[lower] = [];
    answerGroups[lower].push(playerId);
  }

  for (const playerId of allPlayerIds) {
    const ans = (answers[playerId] ?? "").trim();
    if (!ans) {
      scores[playerId] = 0;
    } else {
      const lower = ans.toLowerCase();
      const group = answerGroups[lower];
      scores[playerId] = group.length === 1 ? 10 : 0;
    }
  }

  return scores;
}