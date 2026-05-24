# Decisions Log

Record only decisions that affect multiple agents.

## 2026-05-24

Decision: accept Spy / Impostor as playable and freeze new game development before video.

Reason: Spy / Impostor gives strong product proof for website-native hidden roles, and six playable games are enough. The next win is recording and deployment, not more features.

Files affected:

```txt
components/games/SpyImpostor.tsx
data/gameContent/spyImpostor.ts
app/page.tsx
data/gameCatalog.ts
```

Verification:

```txt
npm run typecheck passed in Claude handoff.
npm run build passed in Claude handoff.
```

Next:

```txt
No new games before video.
QA The Hat and Spy only if it does not delay recording.
Record 60-second demo.
```

## 2026-05-24

Decision: approve `spy-impostor` as a frozen gameId and catalog entry.

Reason: Spy / Impostor is easier to evaluate than Broken Telephone and gains more from a website through private role assignment, room code mode, generated word packs, voting, and AI players.

Files affected:

```txt
types/culture.ts
data/gameCatalog.ts
data/cultures.ts
WorldPlayHost_Vault/07_GAME_SCOPE_AND_DOD.md
WorldPlayHost_Vault/21_PRODUCT_STRATEGY.md
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
```

## 2026-05-24

Decision: mark The Hat / Shapka as present and wired, pending QA/visual review.

Reason: component and data files exist, `app/page.tsx` imports `TheHat`, and the catalog now has complete required metadata.

Files affected:

```txt
components/games/TheHat.tsx
data/gameContent/theHat.ts
app/page.tsx
data/gameCatalog.ts
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
```

## 2026-05-24

Decision: restate product mode priority as local party first, remote friends second, AI players third.

Reason: the product is an AI host for live social play, not primarily a generic online multiplayer site.

Impact:

```txt
Main demo should show friends around one device.
Room code mode is a product expansion for remote friends.
AI players supplement missing seats or solo testing.
New games should support these three modes.
```

## 2026-05-24

Decision: prioritize judge-friendly familiar party games after the first four cultural games.

Reason: judges should be able to understand and evaluate the product instantly without getting blocked by unfamiliar rules.

Priority additions:

```txt
The Hat / Shapka
Truth or Dare
Spy / Impostor
Taboo / Don't Say It
Charades / Explain-the-word
```

Dropped from priority:

```txt
Broken Telephone
```

Reason: the site should make hard-in-real-life mechanics easier. Spy/Impostor and Taboo benefit more from hidden role assignment, generated cards, timers, AI referee/player support, and remote room mode.

## 2026-05-24

Decision: external Postgres is critical for live deploy.

Reason: local SQLite proves the server/database layer locally, but a live Vercel product needs persistent external storage.

Preferred path:

```txt
Neon or Supabase Postgres
Guest room tables
Room players
Room events
Product Pulse backed by live database
No email/password auth
```

Status:

```txt
Postgres adapter exists in lib/server/db.ts and lib/server/roomStore.ts.
Neon DATABASE_URL is configured locally.
Local smoke tests pass against hosted Neon Postgres:
GET /api/product/pulse
POST /api/rooms
POST /api/rooms/:code/join
POST /api/rooms/:code/event
GET /api/rooms/:code
Next required action is adding DATABASE_URL and DEEPSEEK_API_KEY to Vercel.
```

## 2026-05-24

Decision: add lightweight guest-room auth and server-backed multiplayer foundation.

Reason: the project needs to read as a real product, but heavy auth, profiles, and long-term history are still unnecessary for the hackathon demo.

Scope:

```txt
Guest name + room code
Create / join room
Server-backed players list
Room event log
Product Pulse stats
Daily challenge from playable catalog
No email/password auth
No account profiles
No long-term personal history
```

Files affected:

```txt
types/room.ts
lib/server/roomStore.ts
app/api/rooms/*
app/api/product/pulse/route.ts
app/page.tsx
app/globals.css
.gitignore
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
POST /api/rooms created a room.
POST /api/rooms/:code/join added a second player.
POST /api/rooms/:code/event updated selected culture/game.
GET /api/product/pulse returned updated room/player/event counts.
```

Current status:

```txt
Original local SQLite proof has been superseded by a Postgres adapter.
Room APIs now require DATABASE_URL.
Current multiplayer sync covers room/lobby/discovery/events, not per-game move sync yet.
```

## 2026-05-24

Decision: accept visible gameplay AI integration across all four playable games.

Reason: the product now shows live/fallback AI Host status and text inside gameplay, not only during Spin the Globe.

Files affected:

```txt
lib/ai/gameAIClient.ts
components/games/GolYaPooch.tsx
components/games/Daruma.tsx
components/games/Loteria.tsx
components/games/Adedonha.tsx
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
Live explainRules and hostComment smoke tests returned provider: "deepseek", fallback: false.
```

Risk:

```txt
Live gameplay AI increases API usage during phase changes. The client currently avoids rapid repeat calls for identical phase/round keys.
```

## 2026-05-24

Decision: accept Antigravity's Adedonha visual alignment.

Reason: the fourth playable game now matches the premium tabletop/passport visual direction without changing gameplay logic.

Files affected:

```txt
components/games/Adedonha.tsx
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
```

## 2026-05-24

Decision: mark live DeepSeek path as verified locally.

Reason: `.env.local` is configured and `/api/ai` returned `provider: "deepseek"` with `fallback: false` for the three product-critical modes.

Commands verified:

```txt
POST /api/ai mode=spinDiscovery
POST /api/ai mode=explainRules
POST /api/ai mode=hostComment
```

Next priority:

```txt
Wire explainRules / hostComment into visible game AI Host panels.
Keep fallback mode available for demos without provider keys.
```

## 2026-05-24

Decision: create `WorldPlayHost_Vault` as the shared Obsidian context.

Reason: multiple AI agents will work in parallel and need one compact source of truth.

Impact:

```txt
Agents should read this vault instead of the full source planning documents.
Contracts live in 05/06.
Task ownership lives in 03/04.
```

## 2026-05-24

Decision: enable `buildDiscovery({ useAI: true })` from the UI now that Kiro has implemented fallback-safe `/api/ai` `spinDiscovery`.

Reason: AI integration should be visible in the product path, while the route still returns HTTP 200 fallback when no provider key exists.

Files affected:

```txt
app/page.tsx
WorldPlayHost_Vault/02_CURRENT_STATUS.md
WorldPlayHost_Vault/04_TASK_BOARD.md
```

Agents affected:

```txt
Kiro/OpenCode can test live DeepSeek with .env.local.
Open-design should show Live/Simulation AI Host badge states.
Claude can continue games without touching AI route.
```

## 2026-05-24

Decision: accept Claude Code's tiny `app/page.tsx` edit for Daruma wiring.

Reason: it followed the existing dynamic import pattern used by Gol ya Pooch and kept integration localized.

Files affected:

```txt
app/page.tsx
components/games/Daruma.tsx
data/gameContent/daruma.ts
```

Verification:

```txt
npm run build passed.
npm run typecheck passed after Next generated .next/types.
```

## 2026-05-24

Decision: accept Antigravity's Open Design production polish pass.

Reason: it applied the agreed tokens and layout direction while preserving contracts and build stability.

Files affected:

```txt
app/globals.css
app/page.tsx
components/games/GolYaPooch.tsx
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
```

## 2026-05-24

Decision: accept Codex CLI's `playableGameComponents` map in `app/page.tsx`.

Reason: it reduces repeated render branches and makes each new playable game a small map addition.

Files affected:

```txt
app/page.tsx
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
```

Risk:

```txt
Future playable game components should keep accepting `playerCount` and `onBack`, or TypeScript will flag the mismatch.
```

## 2026-05-24

Decision: accept Adedonha / Stop as the fourth playable game.

Reason: it adds a distinct word/category mechanic and completes the Tier 1 playable-game set.

Files affected:

```txt
app/page.tsx
components/games/Adedonha.tsx
data/gameContent/adedonha.ts
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
```

## 2026-05-24

Decision: mark AI backend fallback smoke tests as demo-safe.

Reason: Kiro verified `spinDiscovery`, `explainRules`, `hostComment`, and unknown mode all return HTTP 200 fallback JSON locally.

Commands verified:

```txt
POST /api/ai mode=spinDiscovery
POST /api/ai mode=explainRules
POST /api/ai mode=hostComment
POST /api/ai mode=unknownThing
```

## 2026-05-24

Decision: pause new game expansion until live AI is visible inside gameplay.

Reason: four playable games are enough for a strong prototype, but the product still feels too fallback/static if game screens show only Simulation Mode.

Next priority:

```txt
Add DEEPSEEK_API_KEY locally
Verify provider: "deepseek"
Wire explainRules / hostComment into visible game AI Host panels
Then move to deploy/demo readiness
```

Visual compromise:

```txt
Card corners kept restrained at 8px for consistency with existing app geometry.
```

## 2026-05-24

Decision: accept Loteria as the third playable game and keep the existing tiny `app/page.tsx` dynamic import pattern.

Reason: it matches the established integration approach and gives the demo a visually distinct board/caller game.

Files affected:

```txt
app/page.tsx
components/games/Loteria.tsx
data/gameContent/loteria.ts
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
```

## 2026-05-24

Decision: accept Kiro's `explainRules` and `hostComment` AI modes without adding shared type contracts.

Reason: these are fallback-safe server route modes and no UI currently depends on a frozen cross-agent contract for them.

Files affected:

```txt
app/api/ai/route.ts
lib/ai/prompts.ts
lib/ai/fallback.ts
```

Verification:

```txt
npm run typecheck passed.
npm run build passed.
```

## Decision Template

```txt
Date:
Decision:
Reason:
Files affected:
Agents affected:
Rollback:
```
