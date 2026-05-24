# Submission Checklist

## Product Framing (must be consistent across video, README, and submission form)

```txt
Primary use case:    Local party mode — one device on the table, friends in the same room.
Secondary use case:  Remote friends mode — lightweight guest name + room code link.
Supporting use case: AI players fill missing seats so a session is never blocked.
AI:                  Live DeepSeek host verified locally; deterministic fallback if no key.
Persistence:         Postgres adapter exists; external Postgres (Neon / Supabase)
                     DATABASE_URL is required for live Vercel rooms.
```

## Current Playable Games

```txt
Gol ya Pooch, Daruma-san ga koronda, Loteria, Adedonha / Stop, Shapka / The Hat
```

## Coming / Judge-Priority Games

```txt
Shapka (The Hat)   — judge-familiar word-guessing classic
Truth or Dare      — universal party loop
Spy / Impostor     — hidden roles, private reveal, vote, AI player potential
Taboo              — generated forbidden-word cards, AI referee potential
```

When any of these go playable, mention them in the submission writeup as "now playable" and promote them in the demo route.

## Before Final Video

```txt
Open app in clean browser
Check 100% zoom
Close extra tabs
Check no API keys visible
Check Spin the Globe works
Check AI Host badge reads "DeepSeek Live" (not Simulation) for the final take
Check fallback path still works after blanking keys (sanity test, not on final take)
Check at least one playable game works
Check result/replay works
Check room code field is visible at least once
Check "Add AI player" affordance is visible at least once
Check mobile width quickly
```

## Required Submission Artifacts

```txt
GitHub repo link
Live demo link (only if Postgres is wired on Vercel and rooms persist)
Recorded 60-second video (silent-readable)
README with product description, modes, AI usage, and run-locally instructions
AI usage explanation (DeepSeek live + fallback simulation)
Local run instructions
```

## README Must Say

```txt
WorldPlay Host is an AI-hosted platform for playing folk and party games from around the world.

Local party mode is primary: one device on the table for friends in the same room.
A lightweight room code lets remote friends join, and AI players fill any missing seats.

The AI Host recommends games, explains rules, and reacts in-game.
Live DeepSeek mode is verified; if the provider is unavailable, deterministic fallback keeps the demo playable.

For live Vercel deploys, room state must move to external Postgres (Neon / Supabase).
Room state uses Postgres through DATABASE_URL for live deployment.
```

## Live Deploy Requirements (Vercel)

```txt
DEEPSEEK_API_KEY        set in Vercel env (server-only, never exposed to client)
DATABASE_URL            external Postgres connection string (Neon or Supabase)
                        — required for room/lobby/event persistence
AI_TIMEOUT_MS           optional override; default 7000 ms
AI_MAX_TOKENS           optional override; default 180

Note: room APIs require external Postgres on live deploy.
```

## Local Run

```bash
npm install
npm run dev
```

## Emergency Note

```txt
If the live deployment is unavailable (often because Postgres is not yet wired),
please watch the recorded 60-second demo video. The project runs locally with
`npm install && npm run dev`. AI calls go through `/api/ai` with deterministic
fallback mode; live DeepSeek mode activates automatically when `DEEPSEEK_API_KEY`
is set in `.env.local`. Room APIs require `DATABASE_URL`.
```
