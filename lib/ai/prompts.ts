/**
 * Prompt builders for WorldPlay Host AI modes.
 *
 * Rules:
 * - Never ask the AI to invent gameIds.
 * - Only pass candidateGames already validated locally.
 * - Keep prompts terse to stay within token budgets.
 * - System message enforces JSON-only output.
 */

import type { SpinDiscoveryAIRequest } from "@/types/ai";

// ---------------------------------------------------------------------------
// Shared local request types (not in types/ai.ts — no contract change needed)
// ---------------------------------------------------------------------------

export type ExplainRulesRequest = {
  mode: "explainRules";
  gameId: string;
  cultureId?: string;
  /** Optional focused question from the game UI, e.g. "how do I win?" */
  prompt?: string;
};

export type HostCommentRequest = {
  mode: "hostComment";
  gameId: string;
  cultureId?: string;
  /** Human-readable description of the current situation */
  prompt?: string;
  /** Machine-readable game state snapshot (capped before sending to AI) */
  gameState?: unknown;
};

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// ---------------------------------------------------------------------------
// Game metadata used to give the AI context without requiring the full catalog
// ---------------------------------------------------------------------------

type GameMeta = { title: string; culture: string; description: string };

const GAME_META: Record<string, GameMeta> = {
  "gol-ya-pooch": {
    title: "Gol ya Pooch",
    culture: "Iran",
    description:
      "Hidden-choice game: each player secretly hides objects in their fist, picking flowers (gol) or dust (pooch). Players shout a guess for the total; closest wins the round.",
  },
  daruma: {
    title: "Daruma-san ga Koronda",
    culture: "Japan",
    description:
      "Freeze-and-move game: one player faces the wall and chants the phrase while others sneak closer. Turn around fast — anyone caught moving is out.",
  },
  loteria: {
    title: "Lotería",
    culture: "Mexico",
    description:
      "Caller-board game like bingo with illustrated cards. The caller draws and announces cards; players mark matching images on their board. First to complete a row wins.",
  },
  adedonha: {
    title: "Adedonha (Stop)",
    culture: "Brazil",
    description:
      "Word-category race: a random letter is picked and a countdown starts. Players fill categories — animal, food, city — with words starting with that letter. Unique answers score points.",
  },
};

function gameLabel(gameId: string): string {
  const meta = GAME_META[gameId];
  return meta ? `${meta.title} (${meta.culture})` : gameId;
}

function gameDescription(gameId: string): string {
  return GAME_META[gameId]?.description ?? "";
}

// ---------------------------------------------------------------------------
// spinDiscovery
// ---------------------------------------------------------------------------

/**
 * Build the system + user messages for "spinDiscovery" mode.
 *
 * The AI must:
 *  - Return ONLY a single JSON object (no markdown fences, no extra text).
 *  - Use ONLY the gameIds provided in candidateGames.
 *  - Keep all text fields short (1-2 sentences max).
 */
export function buildSpinDiscoveryMessages(
  req: SpinDiscoveryAIRequest,
): AIMessage[] {
  const gameList = req.candidateGames
    .map(
      (g, i) =>
        `${i + 1}. gameId="${g.gameId}" title="${g.title}" country="${g.country}"`,
    )
    .join("\n");

  const system = `You are the AI host for WorldPlay Host, a party-game platform celebrating world cultures.
Tone: warm, brief, culturally curious. Never stereotype or invent facts.
Output: ONLY a single valid JSON object — no markdown fences, no commentary.`;

  const user = `Culture: ${req.country} (id: ${req.cultureId})
Players: ${req.playerCount}
Vibe: ${req.vibe}

Candidate games — use ONLY these gameIds, exactly as written:
${gameList}

Return this exact JSON shape (all string values ≤ 2 sentences):
{
  "hostIntro": "warm 1-2 sentence intro about ${req.country}",
  "culturalFact": "one genuine interesting fact about ${req.country} or its games",
  "openingLine": "short energetic line to kick off the session",
  "recommendations": [
    {
      "gameId": "<exact id from list above>",
      "title": "<title>",
      "country": "<country>",
      "reason": "<1 sentence why it fits the ${req.vibe} vibe for ${req.playerCount} players>",
      "badge": "<2-3 word label e.g. Host pick>",
      "priority": 1
    }
  ]
}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// ---------------------------------------------------------------------------
// explainRules
// ---------------------------------------------------------------------------

/**
 * Builds messages for "explainRules" mode.
 *
 * Output is plain prose (≤ 3 sentences). No JSON wrapper — the route uses
 * the raw text directly as the `text` field in the response.
 */
export function buildExplainRulesMessages(
  req: ExplainRulesRequest,
): AIMessage[] {
  const label = gameLabel(req.gameId);
  const desc = gameDescription(req.gameId);
  const question =
    req.prompt?.trim() ||
    "Explain the rules in plain, friendly language for players who have never played before.";

  const system = `You are the AI host for WorldPlay Host, a party-game platform celebrating world cultures.
Tone: warm, clear, and brief. Write at most 3 sentences of plain prose.
No markdown, no bullet points, no numbered lists, no headers. Plain sentences only.`;

  const user = `Game: ${label}${desc ? `\nContext: ${desc}` : ""}
Question: ${question}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// ---------------------------------------------------------------------------
// hostComment
// ---------------------------------------------------------------------------

/**
 * Builds messages for "hostComment" mode.
 *
 * Output is a single short sentence (≤ 15 words). Plain text, no JSON.
 */
export function buildHostCommentMessages(req: HostCommentRequest): AIMessage[] {
  const label = gameLabel(req.gameId);
  const situation = req.prompt?.trim() || "The game is in progress.";

  // Cap gameState to avoid blowing token budget on large objects
  const stateSnippet = req.gameState
    ? `\nGame state: ${JSON.stringify(req.gameState).slice(0, 200)}`
    : "";

  const system = `You are the AI host for WorldPlay Host, a party-game platform celebrating world cultures.
Give ONE short reaction comment: 1 sentence, max 15 words. Warm, fun, encouraging.
No markdown. No quotation marks. Plain text only.`;

  const user = `Game: ${label}\nSituation: ${situation}${stateSnippet}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
