"use client";

import { useCallback, useEffect, useState } from "react";
import type { AIProvider } from "@/types/ai";

export type GameAIText = {
  text: string;
  provider: AIProvider;
  fallback: boolean;
  loading: boolean;
};

type SimpleAIResponse = {
  text?: unknown;
  provider?: unknown;
  fallback?: unknown;
};

type UseGameAIHostInput = {
  gameId: string;
  cultureId: string;
  rulesPrompt: string;
  initialRules: string;
  initialComment: string;
};

function fallbackText(text: string): GameAIText {
  return {
    text,
    provider: "fallback",
    fallback: true,
    loading: false
  };
}

function normalizeProvider(provider: unknown): AIProvider {
  return provider === "deepseek" ||
    provider === "openrouter" ||
    provider === "openai" ||
    provider === "fallback"
    ? provider
    : "fallback";
}

function normalizeAIResponse(
  value: SimpleAIResponse,
  fallback: string
): GameAIText {
  const text = typeof value.text === "string" && value.text.trim()
    ? value.text.trim()
    : fallback;
  const fallbackMode = typeof value.fallback === "boolean" ? value.fallback : true;

  return {
    text,
    provider: normalizeProvider(value.provider),
    fallback: fallbackMode,
    loading: false
  };
}

async function requestGameAI(
  body: Record<string, unknown>,
  fallback: string
): Promise<GameAIText> {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return fallbackText(fallback);
    }

    return normalizeAIResponse((await response.json()) as SimpleAIResponse, fallback);
  } catch {
    return fallbackText(fallback);
  }
}

export function formatGameAIStatus(result: GameAIText): string {
  if (result.loading) {
    return "AI Thinking";
  }

  if (result.fallback || result.provider === "fallback") {
    return "Simulation Mode";
  }

  return result.provider === "deepseek"
    ? "DeepSeek Live"
    : `${result.provider} Live`;
}

export function useGameAIHost({
  gameId,
  cultureId,
  rulesPrompt,
  initialRules,
  initialComment
}: UseGameAIHostInput) {
  const [rules, setRules] = useState<GameAIText>(() => fallbackText(initialRules));
  const [comment, setComment] = useState<GameAIText>(() =>
    fallbackText(initialComment)
  );

  const explainRules = useCallback(async () => {
    setRules((current) => ({ ...current, loading: true }));
    const nextRules = await requestGameAI(
      {
        mode: "explainRules",
        gameId,
        cultureId,
        prompt: rulesPrompt
      },
      initialRules
    );
    setRules(nextRules);
  }, [cultureId, gameId, initialRules, rulesPrompt]);

  const hostComment = useCallback(
    async (prompt: string, gameState?: unknown, fallback = initialComment) => {
      setComment((current) => ({ ...current, loading: true }));
      const nextComment = await requestGameAI(
        {
          mode: "hostComment",
          gameId,
          cultureId,
          prompt,
          gameState
        },
        fallback
      );
      setComment(nextComment);
    },
    [cultureId, gameId, initialComment]
  );

  useEffect(() => {
    void explainRules();
  }, [explainRules]);

  return {
    rules,
    comment,
    explainRules,
    hostComment,
    rulesStatus: formatGameAIStatus(rules),
    commentStatus: formatGameAIStatus(comment)
  };
}
