export type DarumaPhase =
  | "intro"
  | "ready"
  | "move"
  | "freeze"
  | "caught"
  | "survived"
  | "game-over";

export type DarumaGameState = {
  phase: DarumaPhase;
  progress: number; // 0-100, distance toward the Oni
  round: number;
  totalRounds: number;
  score: number;
  caughtCount: number;
  survivedCount: number;
  currentChant: string;
  chantSpeed: "slow" | "medium" | "fast";
  oniMood: string;
};

/** Fallback chant lines the Oni says while players move. */
export const ONI_CHANTS = [
  "だるまさんがころんだ…",
  "Daruma-san ga koronda…",
  "The daruma is falling…",
  "One step… two steps… freeze!",
  "Are you brave enough to move?",
  "The daruma watches with painted eyes…",
  "Careful… the Oni can feel your footsteps.",
  "Move now, or stay forever behind.",
  "Daruma-san… ga… ko-ron-da!",
  "The wind carries your movement.",
];

/** Short Oni reaction lines when a player is caught. */
export const ONI_CAUGHT_LINES = [
  "Caught! The Oni saw you twitch!",
  "Frozen too late — back to start!",
  "The daruma's eyes see everything.",
  "Not fast enough! The Oni wins this round.",
  "Your shadow moved — the Oni noticed!",
  "Penalty! Stillness was your only shield.",
];

/** Oni lines when the player survives a freeze. */
export const ONI_SAFE_LINES = [
  "Perfect freeze! The Oni suspects nothing.",
  "Like a statue — well done!",
  "The daruma blinks… you passed.",
  "Not a muscle moved. Impressive.",
  "The Oni turns away, satisfied.",
  "You held your breath perfectly.",
];

/** Oni lines when the player reaches the finish. */
export const ONI_WIN_LINES = [
  "You touched the Oni! You win!",
  "The daruma falls — victory is yours!",
  "Incredible! You made it all the way!",
  "The Oni bows — a worthy challenger!",
];

export const GAME_INSTRUCTIONS = [
  "The Oni chants and then suddenly turns around.",
  "During the chant (Move phase), tap the Move button to advance.",
  "When the Oni turns (Freeze phase), you must NOT press anything.",
  "If you press Move during Freeze, you're caught — penalty!",
  "Reach 100% progress to touch the Oni and win the round.",
  "Survive as many rounds as you can!",
];

/** Mood labels for the Oni at different difficulty levels. */
export const ONI_MOODS = [
  { speed: "slow" as const, label: "Drowsy Oni", emoji: "😴" },
  { speed: "medium" as const, label: "Alert Oni", emoji: "👹" },
  { speed: "fast" as const, label: "Furious Oni", emoji: "😡" },
];
