# Data Contracts

These TypeScript contracts are frozen unless Codex explicitly changes them.

## `types/culture.ts`

```ts
export type CultureId =
  | "kazakhstan"
  | "japan"
  | "brazil"
  | "nigeria"
  | "india"
  | "turkey"
  | "mexico"
  | "korea"
  | "iran"
  | "italy"
  | "classic";

export type PartyVibe =
  | "funny"
  | "chaotic"
  | "cultural"
  | "family"
  | "strategic"
  | "deep";

export type GameId =
  | "asyk-atu"
  | "togyzkumalak-lite"
  | "daruma"
  | "kagome-kagome"
  | "peteca-lite"
  | "adedonha"
  | "ayo-lite"
  | "suwe"
  | "antakshari"
  | "kabaddi-cards"
  | "mangala-lite"
  | "mendil-kapmaca"
  | "loteria"
  | "vibora-de-la-mar"
  | "yutnori-sprint"
  | "gonggi-lite"
  | "gol-ya-pooch"
  | "dooz-lite"
  | "strega-colore"
  | "morra"
  | "the-hat"
  | "truth-or-dare"
  | "broken-telephone";

export type CulturePack = {
  id: CultureId;
  country: string;
  flag: string;
  greeting: string;
  hostName: string;
  hostVoiceLang: string;
  visualTheme: {
    gradientClass: string;
    accentClass: string;
    stampLabel: string;
    icon: string;
  };
  facts: string[];
  featuredGameIds: GameId[];
  supportedVibes: PartyVibe[];
  fallbackHostIntro: string;
  fallbackOpeningLine: string;
};
```

## `types/game.ts`

```ts
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
```

## `types/ai.ts`

```ts
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
```

## Contract Rule

If a game or AI feature needs extra data, add optional fields through Codex after checking every consumer. Do not rename existing fields during active build.
