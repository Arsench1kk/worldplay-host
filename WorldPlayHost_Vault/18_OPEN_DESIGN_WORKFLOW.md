# Open Design Workflow

Open Design is a local design/mockup workspace. It is not the production app.

## Local Server

```txt
http://127.0.0.1:56181/
```

## Source Folder

```txt
/Users/arsenabduhalyk/Projects/DesignLab/open-design
```

## Project Layout

Each design project usually lives under:

```txt
/Users/arsenabduhalyk/Projects/DesignLab/open-design/.od/projects/<project-id-or-name>/
```

Recommended mockup structure:

```txt
index.html
screens/
styles/
assets/
```

## What Open Design Is For

Use Open Design for:

```txt
static HTML/CSS screen mockups
screen galleries
interaction-state references
visual exploration before implementation
handoff prompts for design agents
```

Do not use Open Design for:

```txt
production app code
backend logic
auth
payments
database
framework complexity
daemon or agent config changes
```

## No-Touch Paths

Never touch:

```txt
open-design/apps/
open-design/packages/
open-design/node_modules/
open-design/.tmp/
open-design/.od/app-config.json
Open Design daemon/agent configuration
```

If editing an Open Design project is explicitly requested, edit only:

```txt
open-design/.od/projects/<project>/
```

## Required Preflight Before Any Open Design Task

Before doing Open Design-related work, first summarize:

```txt
Target project/folder:
Files I plan to read:
Files I plan to edit:
What I will not touch:
```

If filesystem access to `/Users/arsenabduhalyk/Projects/DesignLab/open-design` is unavailable, say so clearly and ask the user to add that folder to the workspace or paste relevant files.

## Mockup Rules

```txt
Build the actual usable screen first, not a landing page.
Use static HTML/CSS unless asked otherwise.
Make all links between screens work.
Avoid bloated explanatory text inside the UI.
Keep UI polished and useful for later implementation.
```

For WorldPlay Host, the first Open Design mockups should focus on:

```txt
Home / Spin the Globe
Culture Arrival
AI Host panel
Game card / recommendation state
One playable game screen
Result / replay screen
```

## Open Design Chat Prompt Template

Paste this into the Open Design chat when starting the design project:

```txt
Create a static HTML/CSS mockup project for WorldPlay Host.

Project context:
WorldPlay Host is an AI-powered web platform where a group spins the globe, discovers a real folk or party game from a culture, and lets an AI host teach, run, and remix it.

This is a design/mockup project only, not production code.

Build:
- index.html as a screen gallery
- screens/home-spin-globe.html
- screens/culture-arrival.html
- screens/game-gol-ya-pooch.html
- screens/result.html
- styles/shared.css

Design goals:
- The first screen must be the usable product, not a marketing landing page.
- The UI must communicate the 60-second demo without sound.
- Visual direction: passport for games, party table host, cultural discovery, AI-powered game night.
- Central moment: Spin the Globe -> passport stamp -> AI Host intro -> recommended game -> playable round.

Screen requirements:
1. Home / Spin the Globe:
   player count selector, vibe selector, AI Host badge, large Spin the Globe button, hint of game recommendations.
2. Culture Arrival:
   country flag/name, passport stamp, AI Host intro, cultural fact, 3 recommended game cards, Start Game buttons.
3. Gol ya Pooch game:
   two hands, AI bluff clue, choose left/right, score, next round.
4. Result:
   final score, AI Host verdict, replay, spin again.

Constraints:
- Static HTML/CSS only.
- No backend, auth, payments, database, or framework complexity.
- Keep links between screens working.
- Avoid long explanatory text inside the UI.
- Make mobile and desktop layouts polished.
```
