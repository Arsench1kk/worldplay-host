import { getGamesForCulture, getGameById, isRegisteredGameId } from "@/lib/games/registry";
import type { CulturePack, PartyVibe } from "@/types/culture";
import type {
  GameRecommendation,
  GlobeDiscovery,
  SpinDiscoveryAIRequest,
  SpinDiscoveryAIResponse
} from "@/types/ai";

export type BuildDiscoveryInput = {
  culture: CulturePack;
  playerCount: number;
  vibe: PartyVibe;
  useAI?: boolean;
};

function buildReason(vibe: PartyVibe, title: string): string {
  const reasons: Record<PartyVibe, string> = {
    funny: `${title} gives the room a quick laugh without much setup.`,
    chaotic: `${title} keeps everyone alert with fast turns and visible stakes.`,
    cultural: `${title} is a strong first taste of the culture pack.`,
    family: `${title} is easy to explain and friendly for mixed ages.`,
    strategic: `${title} gives the group a compact decision puzzle.`,
    deep: `${title} creates a slower round with bluffing, memory, or reflection.`
  };

  return reasons[vibe];
}

function fallbackBadge(index: number): string {
  return ["Host pick", "Good fit", "Fast start"][index] ?? "Local";
}

function buildLocalRecommendations(input: BuildDiscoveryInput): GameRecommendation[] {
  const games = getGamesForCulture(input.culture.id)
    .filter(
      (game) =>
        input.playerCount >= game.playerRange.min &&
        input.playerCount <= game.playerRange.max
    )
    .sort((first, second) => {
      const firstVibe = first.vibes.includes(input.vibe) ? 0 : 1;
      const secondVibe = second.vibes.includes(input.vibe) ? 0 : 1;
      const firstFeatured = input.culture.featuredGameIds.indexOf(first.id);
      const secondFeatured = input.culture.featuredGameIds.indexOf(second.id);

      return (
        firstVibe - secondVibe ||
        (firstFeatured === -1 ? 99 : firstFeatured) -
          (secondFeatured === -1 ? 99 : secondFeatured)
      );
    });

  const fallbackGames = input.culture.featuredGameIds.flatMap((gameId) => {
    const game = getGameById(gameId);
    return game ? [game] : [];
  });
  const candidates = games.length > 0 ? games : fallbackGames;

  return candidates.slice(0, 3).map((game, index) => ({
    gameId: game.id,
    title: game.title,
    country: game.country,
    reason: buildReason(input.vibe, game.title),
    badge: fallbackBadge(index),
    priority: index + 1
  }));
}

function validateAIRecommendations(
  aiRecommendations: GameRecommendation[],
  fallbackRecommendations: GameRecommendation[]
): GameRecommendation[] {
  const fallbackById = new Map(
    fallbackRecommendations.map((recommendation) => [
      recommendation.gameId,
      recommendation
    ])
  );

  const validated = aiRecommendations
    .filter((recommendation) => isRegisteredGameId(recommendation.gameId))
    .map((recommendation, index) => ({
      ...fallbackById.get(recommendation.gameId),
      ...recommendation,
      priority: index + 1
    }));

  return validated.length > 0 ? validated.slice(0, 3) : fallbackRecommendations;
}

async function fetchAIDiscovery(
  input: BuildDiscoveryInput,
  candidateGames: GameRecommendation[]
): Promise<SpinDiscoveryAIResponse | undefined> {
  const payload: SpinDiscoveryAIRequest = {
    mode: "spinDiscovery",
    cultureId: input.culture.id,
    country: input.culture.country,
    playerCount: input.playerCount,
    vibe: input.vibe,
    candidateGames
  };

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return undefined;
    }

    return (await response.json()) as SpinDiscoveryAIResponse;
  } catch {
    return undefined;
  }
}

export async function buildDiscovery(input: BuildDiscoveryInput): Promise<GlobeDiscovery> {
  const localRecommendations = buildLocalRecommendations(input);
  const fallbackDiscovery: GlobeDiscovery = {
    culture: input.culture,
    recommendations: localRecommendations,
    hostIntro: input.culture.fallbackHostIntro,
    culturalFact: input.culture.facts[0],
    openingLine: input.culture.fallbackOpeningLine,
    aiProvider: "fallback",
    fallback: true
  };

  if (!input.useAI) {
    return fallbackDiscovery;
  }

  const aiDiscovery = await fetchAIDiscovery(input, localRecommendations);

  if (!aiDiscovery) {
    return fallbackDiscovery;
  }

  return {
    culture: input.culture,
    recommendations: validateAIRecommendations(
      aiDiscovery.recommendations,
      localRecommendations
    ),
    hostIntro: aiDiscovery.hostIntro || fallbackDiscovery.hostIntro,
    culturalFact: aiDiscovery.culturalFact || fallbackDiscovery.culturalFact,
    openingLine: aiDiscovery.openingLine || fallbackDiscovery.openingLine,
    aiProvider: aiDiscovery.provider,
    fallback: aiDiscovery.fallback
  };
}
