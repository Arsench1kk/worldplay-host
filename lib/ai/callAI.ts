/**
 * Multi-provider AI caller for WorldPlay Host.
 *
 * Provider order (mirrors 08_AI_BACKEND_CONTRACT.md):
 *   1. DeepSeek  (DEEPSEEK_API_KEY)
 *   2. OpenRouter (OPENROUTER_API_KEY)
 *   3. OpenAI    (OPENAI_API_KEY)
 *
 * If all providers are unconfigured or fail, throws so the caller
 * can return a safe fallback with HTTP 200.
 *
 * SECURITY: This module is server-only. Never import from client code.
 * API keys are read from process.env — never sent to the client.
 */

import type { AIProvider } from "@/types/ai";
import type { AIMessage } from "@/lib/ai/prompts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CallAIResult = {
  text: string;
  provider: AIProvider;
};

// ---------------------------------------------------------------------------
// Config (all from env, never hardcoded)
// ---------------------------------------------------------------------------

function getTimeoutMs(): number {
  return Number(process.env.AI_TIMEOUT_MS ?? 7000);
}

function getDefaultMaxTokens(): number {
  return Number(process.env.AI_MAX_TOKENS ?? 180);
}

// ---------------------------------------------------------------------------
// Fetch with timeout
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Generic OpenAI-compatible chat call
// ---------------------------------------------------------------------------

async function callChatEndpoint(
  url: string,
  apiKey: string,
  model: string,
  messages: AIMessage[],
  maxTokens: number,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    },
    getTimeoutMs()
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 120)}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await response.json()) as any;
  const text: string | undefined = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Empty content in AI response");
  }

  return text;
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

async function callDeepSeek(
  messages: AIMessage[],
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

  const baseUrl =
    process.env.DEEPSEEK_BASE_URL?.replace(/\/$/, "") ??
    "https://api.deepseek.com";
  const model = process.env.AI_MODEL ?? "deepseek-chat";

  return callChatEndpoint(
    `${baseUrl}/chat/completions`,
    apiKey,
    model,
    messages,
    maxTokens
  );
}

async function callOpenRouter(
  messages: AIMessage[],
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  // Use DeepSeek via OpenRouter if available, otherwise a cost-efficient fallback.
  const model = process.env.AI_MODEL
    ? `deepseek/${process.env.AI_MODEL}`
    : "deepseek/deepseek-chat";

  return callChatEndpoint(
    "https://openrouter.ai/api/v1/chat/completions",
    apiKey,
    model,
    messages,
    maxTokens,
    {
      "HTTP-Referer": "https://worldplayhost.app",
      "X-Title": "WorldPlay Host",
    }
  );
}

async function callOpenAI(
  messages: AIMessage[],
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  return callChatEndpoint(
    "https://api.openai.com/v1/chat/completions",
    apiKey,
    "gpt-4o-mini",
    messages,
    maxTokens
  );
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Calls the first available AI provider in priority order.
 * Throws only if every configured provider fails — the caller is responsible
 * for catching and returning a safe fallback.
 */
export async function callAI(
  messages: AIMessage[],
  maxTokens?: number
): Promise<CallAIResult> {
  const tokens = maxTokens ?? getDefaultMaxTokens();
  const errors: string[] = [];

  // 1. DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const text = await callDeepSeek(messages, tokens);
      return { text, provider: "deepseek" };
    } catch (err) {
      errors.push(`DeepSeek: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const text = await callOpenRouter(messages, tokens);
      return { text, provider: "openrouter" };
    } catch (err) {
      errors.push(
        `OpenRouter: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 3. OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const text = await callOpenAI(messages, tokens);
      return { text, provider: "openai" };
    } catch (err) {
      errors.push(`OpenAI: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(
    errors.length > 0
      ? `All AI providers failed: ${errors.join(" | ")}`
      : "No AI provider configured (set DEEPSEEK_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY)"
  );
}
