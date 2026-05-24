# AI Backend Contract

Kiro CLI / OpenCode owns this lane.

## Core Rule

All AI calls go through server-side routes. API keys never appear in client code.

## Required Route

```txt
app/api/ai/route.ts
```

## Provider Order

```txt
DeepSeek
OpenRouter
OpenAI
fallback
```

## Environment

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
AI_PROVIDER=deepseek

OPENROUTER_API_KEY=
OPENAI_API_KEY=

AI_MAX_TOKENS=180
AI_TIMEOUT_MS=7000
```

## Modes

Must-have:

```txt
spinDiscovery
explainRules
hostComment
```

Should-have:

```txt
generateHatWords
generateTruth
generateDare
generateTelephonePhrase
judgeAnswer
aiPlayerMove
```

## `spinDiscovery` Request

```ts
{
  mode: "spinDiscovery",
  cultureId: string,
  country: string,
  playerCount: number,
  vibe: PartyVibe,
  candidateGames: GameRecommendation[]
}
```

## `spinDiscovery` Response

```ts
{
  hostIntro: string,
  culturalFact: string,
  openingLine: string,
  recommendations: GameRecommendation[],
  provider: "deepseek" | "openrouter" | "openai" | "fallback",
  fallback: boolean
}
```

## AI Safety Rules

- Return strict JSON for structured modes.
- Never invent unsupported `gameId`s.
- Only rank or rewrite `candidateGames`.
- Limit prompt input and output tokens.
- Timeout every request.
- On any error, return fallback with HTTP 200.
- UI should show `DeepSeek Live` or `AI Simulation Mode`.

## Prompt Rules

The AI host should be:

```txt
warm
short
respectful
culturally curious
not stereotypical
useful for gameplay
```

Avoid:

```txt
fake accents
long lectures
unsupported cultural claims
adult/unsafe Truth or Dare content
```
