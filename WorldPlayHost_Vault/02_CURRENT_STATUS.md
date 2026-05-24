# Current Status

Last updated: 2026-05-24

## Phase

Implementation active: local platform scaffold, Spin the Globe, live AI route, and six playable games are present.

## Working Context

- Next.js app scaffold exists.
- Local Spin the Globe flow exists.
- `/api/ai` `spinDiscovery` route exists with fallback-first behavior.
- `Gol ya Pooch` playable component exists and is wired from `app/page.tsx`.
- `Daruma-san ga koronda` playable component exists and is wired from `app/page.tsx`.
- `Loteria` playable component exists and is wired from `app/page.tsx`.
- `Adedonha / Stop` playable component exists and is wired from `app/page.tsx`.
- `The Hat / Shapka` playable component exists and is wired from `app/page.tsx`; it still needs QA/visual review.
- `Spy / Impostor` playable component exists and is wired from `app/page.tsx`; it still needs QA/visual review.
- `/api/ai` supports `spinDiscovery`, `explainRules`, and `hostComment` with fallback-first behavior.
- `/api/ai` fallback smoke tests pass for `spinDiscovery`, `explainRules`, `hostComment`, and unknown mode.
- `/api/ai` live DeepSeek smoke tests pass for `spinDiscovery`, `explainRules`, and `hostComment` with `provider: "deepseek"` and `fallback: false`.
- Gameplay AI Host panels are wired to `/api/ai` `explainRules` and `hostComment` through `lib/ai/gameAIClient.ts`.
- All four playable games can show live/fallback AI status labels inside gameplay.
- Adedonha visual styling is aligned with the premium tabletop/passport UI.
- Lightweight multiplayer room layer exists: guest name, room code, create/join, players list, and room events.
- Postgres-backed product server exists through `lib/server/roomStore.ts`, `lib/server/db.ts`, and `/api/rooms/*`.
- Product Pulse endpoint exists at `/api/product/pulse` with active rooms, players, events, and daily challenge.
- `npm run typecheck` passes.
- `npm run build` passes.
- `/api/ai` fallback smoke test returns HTTP 200 with `provider: "fallback"`.
- A Next dev server is already running at `http://localhost:3000` from the local agent workflow.
- Open Design static mockups exist in the `worldplay-host` Open Design project.
- Open Design visual handoff has been applied to production UI by Antigravity.

## Next Integration Goal

Prepare deploy/demo readiness and make room/multiplayer state feel product-ready.

Also improve integration quality:

```txt
Record a final silent 60-second demo path
Prepare live deployment environment variables
Audit first-run UX and placeholder game recommendations
Make the room code / multiplayer value obvious in the demo
Keep Open Design / production UI aligned
```

## Current Blockers

- Live DeepSeek is configured locally in `.env.local`; do not commit or paste the key.
- Several catalog games still open placeholders, but the demo has six playable mechanics.
- Live gameplay AI adds extra API calls on game phase changes; current client guards avoid rapid repeat calls for the same phase/round.
- Neon Postgres `DATABASE_URL` is configured locally in `.env.local`; do not commit or paste it.
- Room create/join/event/snapshot/Product Pulse smoke tests pass against hosted Neon Postgres.
- Current multiplayer is room/lobby/discovery/event sync, not per-game realtime move sync.
- `npm run typecheck` may fail if `.next/types` has not been generated yet; run `npm run build` once, then rerun `npm run typecheck`.
- Open Design mockups still need optional visual inspection in the Open Design UI/browser, but implementation tokens and handoff notes are extracted.

## Do Not Touch Without Integrator Approval

```txt
types/culture.ts
types/game.ts
types/ai.ts
lib/games/registry.ts
lib/globe/buildDiscovery.ts
```

## Integration Owner

This desktop Codex thread owns orchestration: task routing, agent boundaries, integration judgment, and final priority calls.

Codex CLI owns implementation of contracts, registry, app shell, build, and final merge tasks assigned by the orchestrator.

## Latest Agent Handoffs

### Codex CLI

```txt
Done: Next.js scaffold, TS contracts, cultures/catalog, registry, local Spin flow.
Done: visible gameplay AI host layer via `lib/ai/gameAIClient.ts` and all four game components.
Verified: typecheck/build/headless click-through.
```

### Kiro CLI

```txt
Done: /api/ai spinDiscovery, DeepSeek/OpenRouter/OpenAI fallback path, safe gameId filtering.
Done: /api/ai explainRules and hostComment fallback-safe modes.
Verified: live DeepSeek smoke tests pass locally for spinDiscovery, explainRules, and hostComment.
```

### Claude Code CLI

```txt
Done: Gol ya Pooch playable and wired.
Done: Daruma-san ga koronda playable and wired.
Done: Loteria playable and wired.
Done: Adedonha / Stop playable and wired.
Detected: The Hat / Shapka playable and wired; needs QA/visual review.
Done: Spy / Impostor playable and wired; needs QA/visual review.
Next: freeze feature work and record the 60-second demo.
```

### Orchestrator

```txt
Updated app/page.tsx to call buildDiscovery with useAI: true.
Fallback remains demo-safe when no API key exists.
Added lightweight guest room UI, Postgres-backed room API, product pulse, and room event logging.
Configured Neon `DATABASE_URL` locally and verified hosted Postgres room APIs.
Approved `spy-impostor` as the next judge-friendly game contract.
```

### Open Design

```txt
Done: static mockup gallery and screens generated for WorldPlay Host.
Files: index.html, screens/home-spin-globe.html, screens/culture-arrival.html, screens/game-gol-ya-pooch.html, screens/result.html, styles/shared.css.
Done: implementation tokens and production notes extracted into 19_OPEN_DESIGN_HANDOFF.md.
```

### Antigravity

```txt
Done: applied Open Design visual handoff to production app.
Files: app/globals.css, app/page.tsx, components/games/GolYaPooch.tsx.
Verified by orchestrator: npm run typecheck passes; npm run build passes.
Compromise: production card corners kept restrained at 8px for consistency.
```

### Additional Handoffs

```txt
Antigravity aligned Daruma visual styling with production tokens.
Antigravity aligned Loteria visual styling with production tokens.
Antigravity aligned Adedonha visual styling with production tokens.
Open Design added Loteria static mockup.
Codex CLI created README.md.
Codex CLI replaced repeated game render branches with `playableGameComponents` map.
Codex CLI wired gameplay AI calls into Gol ya Pooch, Daruma, Loteria, and Adedonha.
Kiro smoke-tested fallback AI modes.
Kiro smoke-tested live DeepSeek AI modes and gameId safety.
Codex added lightweight guest-room multiplayer server and UI.
Codex approved `spy-impostor` in contracts/catalog and dropped Broken Telephone from priority.
Claude built Spy / Impostor playable and wired it into `app/page.tsx`.
QA created 20_MANUAL_QA_SCRIPT.md; orchestrator updated it for playable Loteria and Adedonha.
```
