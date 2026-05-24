# 60-Second Demo Script

The video must be understandable without sound.

## Product Pitch (one line)

WorldPlay Host is an AI-hosted party platform: one device on the table for local friends, a room code for remote friends, and AI players to fill any missing seats — driven by a live DeepSeek host.

## Product Modes — Order Of Emphasis

```txt
1. Local party mode  — primary. One device. Friends in the same room. Pass-and-play.
2. Remote friends    — secondary. Lightweight guest name + room code link.
3. AI players        — fill empty seats, demo turns, or play solo against the host.
```

The video must lead with local party. Remote room code and AI seat-fill are shown as supporting capabilities, not as the headline.

## Current Playable Games

```txt
Gol ya Pooch (Iran)            hidden-hand reveal
Daruma-san ga koronda (Japan)  freeze-and-go reaction
Loteria (Mexico)               caller-board matching
Adedonha / Stop (Brazil)       letter-category race
Shapka / The Hat (Classic)     word-guessing party classic
Spy / Impostor (Classic)       hidden-role private reveal
```

## Coming / Judge-Priority Games

These are next in line specifically because judges relate to them fast:

```txt
Shapka (The Hat)        word-guessing party classic — high judge recall
Truth or Dare           universal party loop
Spy / Impostor          hidden-role guessing — strong site-native value
Taboo / Don't Say It    forbidden-word cards — AI referee potential
```

Spy / Impostor is now playable. Use it only if the private role reveal reads clearly in the recording; otherwise Loteria remains the safest silent visual.

## Recommended Demo Route

```txt
Primary game:  Loteria (Mexico)
Why:           safest silent visual: 3x3 board + clear row/column win.
Alt game:      Spy / Impostor (Classic)
Why:           best product proof: hidden roles are easier on a website.
Target spin:   Mexico
Provider goal: DeepSeek Live badge visible (live key already configured locally)
```

If the spin does not land on Mexico, see "Fallback Spin Route" below before recording.

## Silent-First Scenario (Loteria primary)

```txt
00:00-00:05
Show WorldPlay Host one-liner: "AI host for world party games — local, remote, or with AI players."
Show player count and vibe selectors.
Set player count 3-4, vibe cultural or family.

00:05-00:10
Briefly show the room-code field / "Invite remote friends" affordance —
then leave it. The headline is the table, not the lobby.

00:10-00:18
Click Spin the Globe. Globe visibly spins and lands on Mexico.
Passport stamp appears.

00:18-00:28
AI Host intro renders with provider badge — confirm "DeepSeek Live".
Cultural fact + 3 recommendations visible. Loteria highlighted.

00:28-00:35
Click Loteria. Game opens with 3x3 tabla board.

00:35-00:50
Caller announces 2-3 cards. Player marks matches.
Hit a row, column, or diagonal — win state triggers.

00:50-00:58
Result screen shows calls used and marked cards.
Briefly hover "AI players" affordance to show seat-fill is one click away.

00:58-01:00
Replay / another-game CTA + footer:
Next.js + DeepSeek Live + Postgres-ready + World games.
```

## Fallback Spin Route

If Spin the Globe does not land on Mexico within two warm-up tries:

```txt
Re-spin up to twice while warming up (not during the final take).
If still not Mexico, record with whatever culture lands and use its featured game:
  Japan/Korea -> Daruma-san ga koronda
  Iran        -> Gol ya Pooch
  Brazil      -> Adedonha / Stop
Adjust 00:28-00:50 to that game's clearest single round.
Daruma:       turnaround freeze + caught-moving moment + reach-wall result.
Gol ya Pooch: hider picks hand -> AI clue -> guess LEFT/RIGHT -> reveal -> score.
Adedonha:     letter appears -> fill categories -> STOP -> score reveal.
```

Any of the four current games is demo-safe. Loteria is preferred only for silent legibility.

## AI Players Beat (optional 5-second insert)

If pacing allows between 00:50 and 00:58:

```txt
Show "Add AI player" filling an empty seat in the lobby.
Cut back to result screen. Implies: never blocked by missing humans.
```

Cut this beat first if the 60-second budget is tight.

## Required UI In Frame

1. Product name and one-liner that names local party + remote + AI players.
2. Spin the Globe button.
3. Passport stamp / culture landing.
4. AI Host panel with **DeepSeek Live** provider badge.
5. Recommended games with the demo game highlighted.
6. One playable round with a clear result/reveal screen.
7. Brief glance at room code or AI-player affordance (supporting, not headline).

## Pre-Record Checklist

```txt
[ ] Dev server warm at http://localhost:3000
[ ] DEEPSEEK_API_KEY present in .env.local so badge reads "DeepSeek Live"
[ ] Browser at 100% zoom, single tab, no extensions visible
[ ] No terminal, no .env.local, no API dashboards in frame
[ ] Spin once as warm-up so globe animation is cached
[ ] Confirm AI Host provider badge reads DeepSeek Live (not Simulation)
[ ] Confirm chosen game card opens the playable game (not a placeholder)
[ ] Audio off — demo must read silently
```

## Silent Re-Watch Test

If sound is removed, viewers still understand:

```txt
what the product is (AI host for world party games, local + remote + AI players)
where AI appears (DeepSeek Live badge + host intro + in-game host comments)
what game is being played
what happened after the player acted
```

## Backup Video Path

If Vercel is unstable or Postgres is not wired yet:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Record local browser only. Do not show terminal, code, `.env.local`, API dashboards, or errors.
