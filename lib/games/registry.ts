import { gameCatalog } from "@/data/gameCatalog";
import type { CultureId, GameId } from "@/types/culture";
import type { GameDefinition } from "@/types/game";

export const gameRegistry = new Map<GameId, GameDefinition>(
  gameCatalog.map((game) => [game.id, game])
);

export function getGameById(gameId: GameId): GameDefinition | undefined {
  return gameRegistry.get(gameId);
}

export function getGamesForCulture(cultureId: CultureId): GameDefinition[] {
  return gameCatalog.filter((game) => game.cultureId === cultureId);
}

export function getPlayableGames(): GameDefinition[] {
  return gameCatalog.filter((game) => game.implementationStatus === "playable");
}

export function isRegisteredGameId(gameId: string): gameId is GameId {
  return gameRegistry.has(gameId as GameId);
}
