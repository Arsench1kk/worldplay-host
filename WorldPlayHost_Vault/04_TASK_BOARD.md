# Task Board

Use this file for short task packets only. No essays.

## Now

| Status | Owner | Task | Files | Done When |
| --- | --- | --- | --- | --- |
| DONE | Codex | Scaffold app and local Spin the Globe flow | `types/*`, `data/*`, `lib/globe/*`, `app/page.tsx` | Globe lands locally and shows recommendations |
| DONE | Antigravity | Apply Open Design visual handoff to production app | `app/globals.css`, `app/page.tsx`, `components/games/GolYaPooch.tsx` | Silent video understands globe -> culture -> games |
| DONE | Open-design Codex | Define visual system and static mockup screens | Open Design `worldplay-host` project | Gallery + screens exist for home, arrival, Gol Ya Pooch, result |
| DONE | Kiro/OpenCode | Add `/api/ai` `spinDiscovery` mode | `app/api/ai/route.ts`, `lib/ai/*` | Live or fallback JSON returns HTTP 200 |
| DONE | Claude Code | Build first playable game | `components/games/GolYaPooch*` | Start -> guess -> reveal -> score -> replay |
| DONE | Claude Code | Build Daruma playable game | `components/games/Daruma*`, `data/gameContent/daruma*`, `app/page.tsx` integration | Start -> move/freeze -> caught/survived -> score -> replay |
| DONE | Claude Code | Build Loteria playable game | `components/games/Loteria*`, `data/gameContent/loteria*`, `app/page.tsx` integration | 3x3 board -> AI caller clue -> mark card -> line win -> replay |
| DONE | Antigravity | Align Daruma visual styling with production tokens | `components/games/Daruma.tsx` only | Daruma feels consistent with premium tabletop/passport UI |
| DONE | Open-design Codex | Produce implementation notes from mockups | `WorldPlayHost_Vault/19_OPEN_DESIGN_HANDOFF.md` | Clear polish checklist for production app |
| DONE | Kiro/OpenCode | Add `explainRules` and `hostComment` modes | `app/api/ai/route.ts`, `lib/ai/*` | Fallback-safe text responses for game UIs |
| DONE | Codex CLI | Create README | `README.md` | Hackathon-ready summary and run instructions |
| DONE | QA | Create manual QA script | `WorldPlayHost_Vault/20_MANUAL_QA_SCRIPT.md` | Practical test checklist exists |
| DONE | Claude Code | Build Adedonha playable game | `components/games/Adedonha*`, `data/gameContent/adedonha*`, `app/page.tsx` integration | letter -> categories -> answers -> score -> replay |
| DONE | Antigravity | Align Loteria visual styling with production tokens | `components/games/Loteria.tsx` only | Loteria feels consistent with premium tabletop/passport UI |
| DONE | Kiro/OpenCode | Smoke-test AI fallback modes | `/api/ai` via curl | all demo-critical modes return HTTP 200 fallback JSON |
| DONE | Codex CLI | Reduce playable game render duplication | `app/page.tsx` | `playableGameComponents` map handles current playable games |
| DONE | Codex | Add and validate live DeepSeek key | `.env.local`, `/api/ai` smoke tests | `provider:"deepseek"`, `fallback:false` locally |
| DONE | Codex CLI | Wire visible AI host calls into gameplay | `components/games/*`, `lib/ai/gameAIClient.ts` | game host panels can show live/fallback comments |
| DONE | Antigravity | Align Adedonha visual styling with production tokens | `components/games/Adedonha.tsx` only | Adedonha feels consistent with premium tabletop/passport UI |
| DONE | Codex | Add lightweight guest rooms | `lib/server/roomStore.ts`, `app/api/rooms/*`, `app/page.tsx` | create/join room, player list, room events, product pulse |

## Next

| Status | Owner | Task |
| --- | --- | --- |
| TODO | Cursor/QA | Final demo script pass after scope freeze |
| DONE | Kiro/OpenCode | Replace local SQLite live path with Neon/Supabase Postgres adapter | `lib/server/roomStore*`, `lib/server/db.ts`, env docs | room APIs are Postgres-backed through `DATABASE_URL` |
| DONE | Codex | Add real Neon `DATABASE_URL` and smoke-test rooms locally | `.env.local`, `/api/rooms/*` | create/join/event works against hosted Postgres |
| CRITICAL | User/Codex | Add DeepSeek + Neon env vars to Vercel | Vercel Project Settings | live link can run AI and room APIs |
| CRITICAL | Codex | Prepare Vercel deploy readiness checklist | README, `.env.example`, submission docs | live link can run DeepSeek + Postgres |
| TODO | Codex | Audit placeholder recommendations and first-run demo path |
| DONE | Claude Code | Build judge-friendly The Hat / Shapka game | `components/games/TheHat.tsx`, `data/gameContent/theHat.ts` | one-device party loop, AI prompts, room-ready events |
| TODO | QA/Antigravity | Review The Hat / Shapka quality | `components/games/TheHat.tsx` | game is demo-safe, mobile-safe, visually aligned |
| DEFER | Claude Code | Build judge-friendly Truth or Dare game | `components/games/*`, `data/gameContent/*` | deferred until after video |
| DONE | Codex | Wire `spy-impostor` after Claude builds component | `app/page.tsx` | dynamic import + playable map entry |
| DONE | Claude Code | Build judge-friendly Spy / Impostor game | `components/games/SpyImpostor.tsx`, `data/gameContent/spyImpostor.ts` | secret roles, question timer, vote, reveal, AI player option |
| TODO | Codex/Claude | Decide whether Loteria, The Hat, or Spy should sync moves through room events first |

## Done

| Status | Owner | Task |
| --- | --- | --- |
| DONE | Codex | Copy source planning files into workspace |
| DONE | Codex | Create shared Obsidian vault |
| DONE | Codex CLI | Build app scaffold and local Spin flow |
| DONE | Kiro CLI | Build `/api/ai` `spinDiscovery` |
| DONE | Claude Code CLI | Build Gol ya Pooch playable |
| DONE | Claude Code CLI | Build Daruma playable |
| DONE | Claude Code CLI | Build Loteria playable |
| DONE | Claude Code CLI | Build Adedonha playable |
| DONE | Open Design | Build static mockup gallery |
| DONE | Open Design | Extract production design tokens and handoff |
| DONE | Open Design | Add Loteria mockup screen |
| DONE | Antigravity | Apply production UI polish from Open Design |
| DONE | Antigravity | Align Daruma visual style |
| DONE | Antigravity | Align Loteria visual style |
| DONE | Antigravity | Align Adedonha visual style |
| DONE | Kiro CLI | Add explainRules and hostComment modes |
| DONE | Kiro CLI | Smoke-test AI fallback modes |
| DONE | Kiro CLI | Smoke-test live DeepSeek modes and gameId safety |
| DONE | Codex | Add local DeepSeek key and smoke-test live AI modes |
| DONE | Codex CLI | Wire visible gameplay AI host layer |
| DONE | Codex | Add lightweight room auth/multiplayer server |
| DONE | Codex CLI | Create README |
| DONE | Codex CLI | Clean game integration map |
| DONE | QA | Create manual QA script |

## Update Format

```txt
Owner:
Status: TODO / IN PROGRESS / BLOCKED / DONE
Task:
Files touched:
Need from others:
```
