# Agent Roles And Ownership

The main rule: agents work in lanes. Do not edit another lane's files unless Codex approves and records it in [[13_DECISIONS_LOG]].

## Codex

Role: platform contract owner and integration lead.

Owns:

```txt
app/page.tsx
app/layout.tsx
types/*
data/cultures.ts
data/gameCatalog.ts
lib/games/registry.ts
lib/globe/*
store/appStore.ts
README.md
CommandCenter / vault updates
build and final integration
```

First deliverable:

```txt
Local Spin the Globe flow with fallback discovery and placeholder game start.
```

## Claude Code

Role: playable game engines.

Owns:

```txt
components/games/*
lib/games/engines/*
data/gameContent/*
game-specific reducers/helpers
```

Does not own:

```txt
SpinGlobe UI
CulturePack type
GameRecommendation type
AI route
```

First deliverable:

```txt
Gol ya Pooch playable, then Daruma, Loteria, Adedonha.
```

## Kiro CLI / OpenCode

Role: AI backend, route fallback, provider integration.

Owns:

```txt
app/api/ai/route.ts
lib/ai/*
types/ai.ts only with Codex approval
.env.example
AI smoke checks
```

Rules:

```txt
Never expose API keys to the client.
Always return fallback HTTP 200 for demo-safe AI modes.
Never invent unsupported game IDs.
```

## Antigravity

Role: visual experience and silent-video clarity.

Owns:

```txt
components/globe/*
components/host/*
components/layout/*
components/ui/*
app/globals.css
visual polish
animations
responsive layout
```

Does not own:

```txt
selected culture logic
game registry logic
AI route
game engine rules
```

## Open-design Codex

Role: product UI designer and design QA agent.

Open-design complements Antigravity. Antigravity can build visual components and animation; Open-design judges whether the whole product reads clearly and feels premium in the 60-second video.

Owns:

```txt
visual direction
component styling recommendations
home/globe/arrival layout critique
mobile and desktop design QA
silent-video readability
microcopy for visible UI labels
design handoff notes for Codex/Antigravity
```

May edit only when explicitly assigned:

```txt
app/globals.css
components/layout/*
components/ui/*
components/globe/*
components/host/*
```

Does not own:

```txt
types/*
data/*
lib/games/*
lib/globe/*
app/api/*
game logic
AI route logic
```

First deliverable:

```txt
Design brief + 10-point UI QA checklist for WorldPlay Host.
If app exists, apply small scoped visual polish without changing contracts.
```

## Cursor / QA / Content

Role: fallback content, validation, README/video support.

Owns:

```txt
fallback words
fallback prompts
short rules text
README draft
demo script
manual QA checklist
```

## Conflict Protocol

If an agent needs a foreign file, it must write a request:

```txt
REQUEST:
Need file:
Reason:
Minimal change:
Risk if not changed:
```

Codex applies or rejects the change.
