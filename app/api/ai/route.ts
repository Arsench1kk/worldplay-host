/**
 * POST /api/ai
 *
 * Central AI route for WorldPlay Host.
 * Server-side only — API keys never reach the client.
 *
 * Contract: 08_AI_BACKEND_CONTRACT.md
 *
 * Invariants:
 *  - Always returns HTTP 200 (even on errors → fallback payload).
 *  - Never invents gameIds; only reranks/rewrites candidateGames from the client.
 *  - Provider order: DeepSeek → OpenRouter → OpenAI → fallback.
 */

import { NextResponse } from "next/server";

import type {
  SpinDiscoveryAIRequest,
  SpinDiscoveryAIResponse,
} from "@/types/ai";
import type { GameRecommendation } from "@/types/ai";
import type { GameId } from "@/types/culture";

import {
  buildSpinDiscoveryMessages,
  buildExplainRulesMessages,
  buildHostCommentMessages,
  type ExplainRulesRequest,
  type HostCommentRequest,
} from "@/lib/ai/prompts";
import {
  buildSpinDiscoveryFallback,
  buildExplainRulesFallback,
  buildHostCommentFallback,
  type SimpleAIResponse,
} from "@/lib/ai/fallback";
import { callAI } from "@/lib/ai/callAI";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** spinDiscovery needs more tokens than the default (180) because it encodes
 *  structured JSON with 3 game recommendations plus 3 text fields. */
const SPIN_DISCOVERY_MAX_TOKENS = 420;

/** explainRules: up to 3 plain sentences. */
const EXPLAIN_RULES_MAX_TOKENS = 120;

/** hostComment: one short sentence, 15 words max. */
const HOST_COMMENT_MAX_TOKENS = 60;

// ---------------------------------------------------------------------------
// JSON parsing helper
// ---------------------------------------------------------------------------

/**
 * Extracts and parses the first JSON object from a string.
 * Handles AI responses that wrap JSON in markdown code fences.
 */
function extractJSON(text: string): Record<string, unknown> | undefined {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return undefined;
  try {
    const value: unknown = JSON.parse(match[0]);
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Strips markdown code fences and leading/trailing whitespace from a
 * plain-text AI response. Some models wrap prose in ```...``` even when
 * instructed not to.
 */
function stripFences(text: string): string {
  return text
    .replace(/^```[\w]*\n?/m, "")
    .replace(/```\s*$/m, "")
    .trim();
}

// ---------------------------------------------------------------------------
// spinDiscovery handler
// ---------------------------------------------------------------------------

async function handleSpinDiscovery(
  req: SpinDiscoveryAIRequest,
): Promise<SpinDiscoveryAIResponse> {
  const fallback = buildSpinDiscoveryFallback(req);

  // Gate: if no candidates were sent, return fallback immediately.
  if (!req.candidateGames || req.candidateGames.length === 0) {
    return fallback;
  }

  try {
    const messages = buildSpinDiscoveryMessages(req);
    const { text, provider } = await callAI(
      messages,
      SPIN_DISCOVERY_MAX_TOKENS,
    );

    const parsed = extractJSON(text);
    if (!parsed) {
      console.warn("[/api/ai] spinDiscovery: could not parse AI JSON response");
      return fallback;
    }

    // -----------------------------------------------------------------------
    // Safety layer: only accept gameIds the client already provided.
    // This enforces "Never invent unsupported gameIds."
    // -----------------------------------------------------------------------
    const allowedIds = new Set<string>(req.candidateGames.map((g) => g.gameId));

    // Build a lookup of the original candidate data so we can fill any gaps
    // the AI might leave in title/country fields.
    const candidateByGameId = new Map<string, GameRecommendation>(
      req.candidateGames.map((g) => [g.gameId, g]),
    );

    const rawRecs = Array.isArray(parsed.recommendations)
      ? (parsed.recommendations as unknown[])
      : [];

    const validatedRecs: GameRecommendation[] = rawRecs
      .filter(
        (r): r is Record<string, unknown> =>
          typeof r === "object" &&
          r !== null &&
          !Array.isArray(r) &&
          typeof (r as Record<string, unknown>).gameId === "string" &&
          allowedIds.has((r as Record<string, unknown>).gameId as string),
      )
      .slice(0, 3)
      .map((r, index) => {
        const gameId = r.gameId as GameId;
        const original = candidateByGameId.get(gameId);
        return {
          gameId,
          title: safeString(r.title) || original?.title || "",
          country: safeString(r.country) || original?.country || "",
          reason: safeString(r.reason) || original?.reason || "",
          badge: safeString(r.badge) || original?.badge || "Host pick",
          priority: index + 1,
        };
      });

    // If the AI returned no usable recommendations, fall back to local ones.
    const recommendations =
      validatedRecs.length > 0 ? validatedRecs : fallback.recommendations;

    return {
      hostIntro: safeString(parsed.hostIntro),
      culturalFact: safeString(parsed.culturalFact),
      openingLine: safeString(parsed.openingLine),
      recommendations,
      provider,
      fallback: false,
    };
  } catch (err) {
    // Log server-side for debugging; never surface to client.
    console.warn(
      "[/api/ai] spinDiscovery error →",
      err instanceof Error ? err.message : String(err),
    );
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// explainRules handler
// ---------------------------------------------------------------------------

async function handleExplainRules(
  req: ExplainRulesRequest,
): Promise<SimpleAIResponse> {
  const fallback = buildExplainRulesFallback(req.gameId);

  try {
    const messages = buildExplainRulesMessages(req);
    const { text, provider } = await callAI(messages, EXPLAIN_RULES_MAX_TOKENS);
    const cleaned = stripFences(text);
    if (!cleaned) return fallback;
    return { text: cleaned, provider, fallback: false };
  } catch (err) {
    console.warn(
      "[/api/ai] explainRules error →",
      err instanceof Error ? err.message : String(err),
    );
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// hostComment handler
// ---------------------------------------------------------------------------

async function handleHostComment(
  req: HostCommentRequest,
): Promise<SimpleAIResponse> {
  const fallback = buildHostCommentFallback();

  try {
    const messages = buildHostCommentMessages(req);
    const { text, provider } = await callAI(messages, HOST_COMMENT_MAX_TOKENS);
    const cleaned = stripFences(text);
    if (!cleaned) return fallback;
    return { text: cleaned, provider, fallback: false };
  } catch (err) {
    console.warn(
      "[/api/ai] hostComment error →",
      err instanceof Error ? err.message : String(err),
    );
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await request.json()) as any;
    const mode: string = typeof body?.mode === "string" ? body.mode : "";

    switch (mode) {
      case "spinDiscovery": {
        const result = await handleSpinDiscovery(
          body as SpinDiscoveryAIRequest,
        );
        return NextResponse.json(result, { status: 200 });
      }

      case "explainRules": {
        const result = await handleExplainRules(body as ExplainRulesRequest);
        return NextResponse.json(result, { status: 200 });
      }

      case "hostComment": {
        const result = await handleHostComment(body as HostCommentRequest);
        return NextResponse.json(result, { status: 200 });
      }

      default:
        // Unknown mode — return a minimal fallback that is still HTTP 200.
        return NextResponse.json(
          {
            fallback: true,
            provider: "fallback",
            error: `Unknown mode: ${mode}`,
          },
          { status: 200 },
        );
    }
  } catch (err) {
    // Body parse failure or unexpected crash — always HTTP 200 for demo safety.
    console.error(
      "[/api/ai] Unhandled route error →",
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json(
      { fallback: true, provider: "fallback" },
      { status: 200 },
    );
  }
}
