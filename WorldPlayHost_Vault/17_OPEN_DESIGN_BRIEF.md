# Open-Design Brief

Open-design Codex is the product UI and design QA agent.

Operational workflow for the local Open Design tool lives in [[18_OPEN_DESIGN_WORKFLOW]].

## Current Design Owner Split

```txt
Antigravity:
Builds visual components, animation, responsive UI, and styled states.

Open-design Codex:
Defines visual direction, checks product clarity, improves microcopy, audits screenshots/video readability, and applies small scoped polish when assigned.
```

## Product Feeling

WorldPlay Host should feel like:

```txt
passport for games
party table host
cultural discovery
AI-powered game night
premium but playful web app
```

It should not feel like:

```txt
generic SaaS dashboard
plain card catalog
AI chatbot wrapper
travel blog
random mini-game dump
```

## First Screen Requirements

The first viewport must show the actual product:

```txt
WorldPlay Host name
one-liner
player count selector
vibe selector
Spin the Globe button
AI Host badge
hint of recommended games / culture discovery
```

No separate marketing hero before the usable app.

## Spin Globe Requirements

```txt
large globe or globe-like focal object
clear "Spin the Globe" action
visible spin/loading state
selected culture landing state
passport stamp moment
AI provider / Simulation Mode badge
```

## Culture Arrival Requirements

```txt
country flag and name
passport stamp
AI Host intro
one short cultural fact
3 recommended game cards
Start Game buttons
```

## AI Host Panel Requirements

The AI Host must be visible, not buried in text.

```txt
AI Host: Live / Simulation Mode
host name
short current instruction
what AI is doing now
```

Examples:

```txt
AI Host Luna is choosing the best game for 5 players.
AI Host Ayan is setting up a precision challenge.
AI Simulation Mode keeps the demo playable offline.
```

## Playable Game Screen Requirements

Every game screen should answer in 5 seconds:

```txt
what game is this?
who is playing?
what should the player do now?
where is the AI Host?
what changed after the action?
what is the score/result?
```

## Visual Constraints

```txt
No dense paragraphs in primary screens.
No hidden AI feature.
No tiny buttons for main actions.
No overlapping text on mobile.
No decorative complexity that slows implementation.
No custom assets required for the first version.
```

## 60-Second Video QA

Pass if a muted viewer can see:

```txt
product name
globe spin
culture landing
AI Host role
recommended games
one playable action
score/result
replay or next game
```

Fail if the demo looks like:

```txt
static catalog
plain generated text
unfinished prototype
AI feature only in README
```
