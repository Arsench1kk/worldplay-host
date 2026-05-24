import type { CulturePack, PartyVibe } from "./culture";
import type { GameId } from "./culture";

export type AIProvider =
  | "deepseek"
  | "openrouter"
  | "openai"
  | "fallback";

export type GameRecommendation = {
  gameId: GameId;
  title: string;
  country: string;
  reason: string;
  badge: string;
  priority: number;
};

export type GlobeDiscovery = {
  culture: CulturePack;
  recommendations: GameRecommendation[];
  hostIntro: string;
  culturalFact: string;
  openingLine: string;
  aiProvider: AIProvider;
  fallback: boolean;
};

export type SpinDiscoveryAIRequest = {
  mode: "spinDiscovery";
  cultureId: string;
  country: string;
  playerCount: number;
  vibe: PartyVibe;
  candidateGames: GameRecommendation[];
};

export type SpinDiscoveryAIResponse = {
  hostIntro: string;
  culturalFact: string;
  openingLine: string;
  recommendations: GameRecommendation[];
  provider: AIProvider;
  fallback: boolean;
};
