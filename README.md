# WorldPlay Host

**Spin the globe. Discover a real folk game. Let an AI host teach, run, and remix it for your group.**

WorldPlay Host is an AI-powered party host for live friends. A group can play around one shared device, invite remote friends with a room code, or add AI players when seats are missing. The group chooses player count and vibe, spins the globe, lands on a culture pack, gets an AI Host intro, then starts a recommended game with live or fallback host guidance.

## Links

- Live demo: https://worldplay-host.vercel.app
- GitHub: https://github.com/Arsench1kk/worldplay-host

## Product Modes

1. **Local party mode** — *primary*. One device on the table, friends together in the same room. Pass-and-play.
2. **Remote friends mode** — *secondary*. Lightweight guest name + room code link for friends playing from different places.
3. **AI players mode** — AI fills missing seats so a session is never blocked, demos turns for new players, or plays solo against the host.

## Current Playable Games

- **Gol ya Pooch** - Iranian hidden-object guessing game.
- **Daruma-san ga koronda** - Japanese stop-and-go reaction game.
- **Loteria** - Mexican caller-board matching game.
- **Adedonha / Stop** - Brazilian word-category race.
- **The Hat / Shapka** - word-guessing party classic.
- **Spy / Impostor** - hidden-role guessing with private role reveal.

Other catalog games may appear as recommendations and currently use placeholder start states while engines are still being built.

## Coming Next (Judge-Priority)

These are next in line because judges recognize them instantly:

- **Truth or Dare** — universal party loop.
- **Taboo / Don't Say It** — generated forbidden-word cards with AI referee potential.
- **The Hat polish** — stronger AI word generation and remote room sync.

## AI Usage

The AI Host recommends games, explains rules, generates content, and keeps the session moving. AI calls go through server-side routes under `/api/ai`; provider keys are never needed in the browser.

Implemented AI modes:

- `spinDiscovery`
- `explainRules`
- `hostComment`

Live DeepSeek mode is verified locally for all three modes. Without a key, the same UI falls back to deterministic Simulation Mode.

## Lightweight Multiplayer

WorldPlay Host includes a lightweight room system:

- Guest name identity, no email/password account.
- Shareable room code.
- Server-backed players list.
- Room events for spins and started games.
- Product Pulse stats and daily challenge.

The room server uses Postgres through Next.js API routes. For live Vercel deploys, set an external Postgres `DATABASE_URL` from Neon or Supabase so room state persists across serverless cold starts.

## Fallback Mode

If provider access is unavailable, deterministic fallback mode keeps the demo playable. Spin the Globe, culture landing, host intro, cultural facts, and recommendations still work locally without live AI.

## Tech Stack

- Next.js
- React
- TypeScript
- Server-side AI route with fallback mode
- Postgres-backed room/session API
- Same-device pass-and-play plus lightweight room mode

## Run Locally

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

For live AI testing, add provider credentials such as `DEEPSEEK_API_KEY` in `.env.local`. The app still runs without them.

## 60-Second Demo Flow

1. Show WorldPlay Host with player count and vibe selectors.
2. Click **Spin the Globe** and show the globe animation.
3. Land on a culture with a passport stamp.
4. Show the AI Host provider badge, intro, fact, and 3 recommended games.
5. Start Loteria, Gol ya Pooch, Daruma-san ga koronda, or Adedonha.
6. Complete a quick round action and show score, reveal, or replay.

## Submission Note

If the live deployment is unavailable, please watch the recorded demo video. The project runs locally with `npm install && npm run dev`, and AI calls are routed through `/api/ai` with deterministic fallback mode.
