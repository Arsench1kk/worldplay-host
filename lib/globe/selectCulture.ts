import { cultures } from "@/data/cultures";
import { getGameById } from "@/lib/games/registry";
import type { CulturePack, CultureId, PartyVibe } from "@/types/culture";

export type SelectCultureInput = {
  playerCount: number;
  vibe: PartyVibe;
  previousCultureId?: CultureId;
  seed?: number;
};

function seededRandom(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function cultureSupportsPlayerCount(culture: CulturePack, playerCount: number): boolean {
  return culture.featuredGameIds.some((gameId) => {
    const game = getGameById(gameId);
    return game && playerCount >= game.playerRange.min && playerCount <= game.playerRange.max;
  });
}

export function selectCulturePack(input: SelectCultureInput): CulturePack {
  const vibeMatches = cultures.filter((culture) => culture.supportedVibes.includes(input.vibe));
  const playerMatches = vibeMatches.filter((culture) =>
    cultureSupportsPlayerCount(culture, input.playerCount)
  );
  const withoutPrevious = playerMatches.filter(
    (culture) => culture.id !== input.previousCultureId
  );
  const candidates =
    withoutPrevious.length > 0
      ? withoutPrevious
      : playerMatches.length > 0
        ? playerMatches
        : vibeMatches.length > 0
          ? vibeMatches
          : cultures;

  const randomValue =
    typeof input.seed === "number" ? seededRandom(input.seed) : Math.random();
  const index = Math.floor(randomValue * candidates.length) % candidates.length;

  return candidates[index];
}
