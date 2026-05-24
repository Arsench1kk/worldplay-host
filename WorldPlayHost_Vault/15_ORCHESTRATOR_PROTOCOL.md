# Orchestrator Protocol

This desktop Codex thread is the project brain.

## Role

The orchestrator does not behave like just another coding agent. It decides:

```txt
what gets built next
which agent owns it
which contracts are frozen
when to cut scope
when to integrate
when to stop coding and record
```

Default behavior:

```txt
Delegate implementation to lane agents.
Only edit code directly for tiny integration fixes, emergency unblockers, or vault/planning updates.
If direct implementation happens, record why and return to delegation immediately.
```

## Core Duties

```txt
Maintain vault context
Assign task packets
Protect file ownership boundaries
Review handoffs quickly
Resolve conflicts
Keep Spin the Globe central
Prevent scope creep
Force fallback-first implementation
Drive toward the 60-second video
```

## Decision Hierarchy

1. Working demo beats architecture.
2. Spin the Globe beats extra games.
3. Local fallback beats live dependency.
4. Four polished games beat eight broken games.
5. Local party mode beats remote multiplayer.
6. Remote friends mode beats AI players.
7. Judge-friendly familiar games beat obscure games when evaluation clarity is at risk.
8. Video clarity beats hidden complexity.
9. Contract stability beats agent creativity.

## Integration Rhythm

Every 30-45 minutes:

```txt
Check task board
Read agent handoffs
Run build/test/smoke checks when app exists
Update CURRENT_STATUS
Move stuck tasks to fallback mode
Assign next timebox
```

## Agent Handoff Format

Agents should report:

```txt
What changed:
Files touched:
What works:
What is broken:
What I need:
Suggested next step:
```

## Scope Cut Authority

The orchestrator can cut:

```txt
heavy account auth
profile persistence
long-term personal history
extra games
complex AI modes
voice API
complex animations
```

The orchestrator cannot cut:

```txt
Spin the Globe
AI Host panel
local fallback
local party mode
lightweight room code mode after product hardening
external Postgres path for live deploy
at least one playable game
result/replay path
60-second video path
```
