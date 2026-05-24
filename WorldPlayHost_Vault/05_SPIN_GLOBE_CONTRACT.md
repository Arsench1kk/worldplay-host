# Spin The Globe Contract

Spin the Globe is the central product loop. It is not decoration.

## No-Break Rules

1. Spin the Globe must work without live AI.
2. Culture selection is local from `data/cultures.ts`.
3. AI can enhance intro, fact, opening line, and recommendation ranking.
4. AI cannot invent unsupported `gameId`s.
5. Recommended game IDs must exist in `lib/games/registry.ts`.
6. Antigravity owns animation only, not data logic.
7. Claude Code owns playable games only, not Spin flow.
8. Kiro/OpenCode owns API route only, not registry.
9. Codex owns contracts, data, and integration.
10. At the first hard checkpoint, the globe must spin and land even if games are placeholders.

## Files

```txt
components/globe/SpinGlobe.tsx
components/globe/CultureArrival.tsx
components/globe/PassportStamp.tsx
components/host/AIHostPanel.tsx

data/cultures.ts
data/gameCatalog.ts

lib/games/registry.ts
lib/globe/selectCulture.ts
lib/globe/buildDiscovery.ts
lib/ai/prompts.ts
lib/ai/fallback.ts

app/api/ai/route.ts

types/culture.ts
types/game.ts
types/ai.ts

store/appStore.ts
```

## Flow

```txt
User clicks Spin the Globe
  -> SpinGlobe calls handleSpin()
  -> selectCulturePack() picks local culture
  -> SpinGlobe animates spin
  -> buildDiscovery() creates local recommendations
  -> buildDiscovery() optionally calls /api/ai spinDiscovery
  -> CultureArrival renders culture, stamp, AI Host, fact, games
  -> user clicks Start Game
  -> app starts game by gameId from registry
```

## Key Functions

```ts
selectCulturePack(input: SelectCultureInput): CulturePack

buildDiscovery(input: BuildDiscoveryInput): Promise<GlobeDiscovery>

getGameById(gameId: GameId): GameDefinition | undefined

getGamesForCulture(cultureId: CultureId): GameDefinition[]

getPlayableGames(): GameDefinition[]
```

## Local First

The selected culture and candidate games are local. AI is a layer on top.

If AI fails, display:

```txt
AI Host: Simulation Mode
fallbackHostIntro
facts[0]
fallback recommendations
```

Never show a broken AI error in the main demo path.
