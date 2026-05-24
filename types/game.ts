import type { CultureId, GameId, PartyVibe } from "./culture";

export type ImplementationStatus =
  | "playable"
  | "lite"
  | "tutorial"
  | "catalog";

export type GameDifficulty = "easy" | "medium" | "hard";

export type GameTemplate =
  | "hidden-choice"
  | "reaction"
  | "caller-board"
  | "word-category"
  | "board-race"
  | "precision-aim"
  | "song-chain"
  | "mancala-lite"
  | "classic-card";

export type GameDefinition = {
  id: GameId;
  title: string;
  originalName?: string;
  translation: string;
  cultureId: CultureId;
  country: string;
  playerRange: {
    min: number;
    max: number;
  };
  mechanicSummary: string;
  aiRole: string;
  implementationStatus: ImplementationStatus;
  implementationDifficulty: GameDifficulty;
  template: GameTemplate;
  vibes: PartyVibe[];
  componentKey: string;
  fallbackContentKey: string;
};
