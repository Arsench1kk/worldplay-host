/**
 * Fallback response builders for WorldPlay Host AI modes.
 *
 * These are used when:
 *  - No AI provider is configured.
 *  - Every provider fails or times out.
 *  - The AI returns unparseable output.
 *
 * All fallbacks return HTTP 200-safe objects with `fallback: true`.
 * Text fields are intentionally empty so the client-side culture pack
 * fields (fallbackHostIntro, facts[0], fallbackOpeningLine) take over
 * inside buildDiscovery().
 */

import type {
  SpinDiscoveryAIRequest,
  SpinDiscoveryAIResponse,
  AIProvider,
} from "@/types/ai";

// ---------------------------------------------------------------------------
// Shared simple response type for plain-text AI modes
// (explainRules, hostComment — not added to types/ai.ts, owned here)
// ---------------------------------------------------------------------------

export type SimpleAIResponse = {
  text: string;
  provider: AIProvider;
  fallback: boolean;
};

// ---------------------------------------------------------------------------
// spinDiscovery
// ---------------------------------------------------------------------------

/**
 * Returns a safe fallback for spinDiscovery.
 *
 * - Empty strings for text so buildDiscovery falls back to culture pack fields.
 * - Returns candidateGames as-is (already locally validated) with corrected priorities.
 * - provider = "fallback", fallback = true.
 */
// ---------------------------------------------------------------------------
// Per-game fallback strings for explainRules
// ---------------------------------------------------------------------------

const EXPLAIN_RULES_FALLBACKS: Record<string, string> = {
  "gol-ya-pooch":
    "Everyone secretly hides some objects in their fist — you pick flowers (gol) or dust (pooch). " +
    "Then all players shout their guess for the total number. " +
    "The closest guess wins the round!",
  daruma:
    "One player faces the wall and chants \u2018Daruma-san ga koronda!\u2019 while everyone else sneaks closer. " +
    "When they turn around, everyone must freeze instantly. " +
    "Anyone caught moving is out — first to tag the wall wins!",
  loteria:
    "The caller draws illustrated cards one by one and reads them aloud. " +
    "Mark the matching picture on your board whenever you hear it. " +
    "First player to complete a full row shouts \u00a1Loter\u00eda! and wins!",
  adedonha:
    "A letter is chosen and a countdown begins — race to write one word per category starting with that letter. " +
    "Categories include animal, food, city, and more. " +
    "Only unique answers score points, so think fast and think differently!",
};

// ---------------------------------------------------------------------------
// Host comment fallback pool (random, game-agnostic)
// ---------------------------------------------------------------------------

const HOST_COMMENT_FALLBACKS: string[] = [
  "Nice move — keep that energy going!",
  "Ooh, things are heating up in here!",
  "The crowd is watching — no pressure!",
  "Bold choice, let\u2019s see how it plays out.",
  "Every player\u2019s game face is firmly on.",
  "That\u2019s the spirit — play on!",
  "Someone\u2019s about to make a legendary move.",
  "Stay sharp — anything can happen!",
];

// ---------------------------------------------------------------------------
// explainRules fallback
// ---------------------------------------------------------------------------

/**
 * Returns a hard-coded rules explanation for the four supported games.
 * Falls back to a generic line for unknown gameIds.
 */
export function buildExplainRulesFallback(gameId: string): SimpleAIResponse {
  const text =
    EXPLAIN_RULES_FALLBACKS[gameId] ??
    "Follow the rules shown on screen, take turns, and have fun — that\u2019s the spirit of this game!";
  return { text, provider: "fallback", fallback: true };
}

// ---------------------------------------------------------------------------
// hostComment fallback
// ---------------------------------------------------------------------------

/**
 * Returns a random encouraging comment from the fallback pool.
 * The randomness is intentional — variety makes the host feel alive.
 */
export function buildHostCommentFallback(): SimpleAIResponse {
  const index = Math.floor(Math.random() * HOST_COMMENT_FALLBACKS.length);
  const text = HOST_COMMENT_FALLBACKS[index];
  return { text, provider: "fallback", fallback: true };
}

// ---------------------------------------------------------------------------
// spinDiscovery fallback
// ---------------------------------------------------------------------------

export function buildSpinDiscoveryFallback(
  req: SpinDiscoveryAIRequest,
): SpinDiscoveryAIResponse {
  return {
    hostIntro: "",
    culturalFact: "",
    openingLine: "",
    recommendations: req.candidateGames.map((game, index) => ({
      ...game,
      priority: index + 1,
    })),
    provider: "fallback",
    fallback: true,
  };
}
