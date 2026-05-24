# WorldPlay Host Vault

This vault is the shared source of truth for all AI agents working on the hackathon project.

Before doing work, every agent must read:

1. [[01_HACKATHON_LOCK]]
2. [[02_CURRENT_STATUS]]
3. [[03_AGENT_ROLES_AND_OWNERSHIP]]
4. [[21_PRODUCT_STRATEGY]]
5. [[05_SPIN_GLOBE_CONTRACT]]
6. The contract file relevant to its lane.

## Product In One Sentence

**WorldPlay Host** is an AI-powered web platform where a group spins the globe, discovers a real folk or party game from a culture, and lets an AI host teach, run, and remix the game.

## Core Demo Loop

```txt
Choose players and vibe
Spin the Globe
Land on a culture
AI Host introduces the cultural pack
Show recommended games
Start a playable mini-game
End with score/result/replay
```

## Non-Negotiable Rules

- Spin the Globe must work without live AI.
- Culture selection is local.
- AI may enhance discovery, but cannot invent unsupported `gameId`s.
- Same-device pass-and-play is the default.
- Local party mode with friends around one device is the core product.
- Remote friends mode and AI players are secondary expansion modes.
- Core demo works; lightweight room code mode and external Postgres deploy path are now allowed.
- Do not add heavy account auth, profiles, or long-term personal history.
- Last 30 minutes are for video, README, final link, and bug fixes only.

## Agent Reading Map

- This desktop Codex thread: [[15_ORCHESTRATOR_PROTOCOL]], [[04_TASK_BOARD]], [[13_DECISIONS_LOG]]
- Codex: [[03_AGENT_ROLES_AND_OWNERSHIP]], [[05_SPIN_GLOBE_CONTRACT]], [[06_DATA_CONTRACTS]], [[10_TIMELINE]]
- Claude Code: [[07_GAME_SCOPE_AND_DOD]], [[06_DATA_CONTRACTS]], [[03_AGENT_ROLES_AND_OWNERSHIP]]
- Kiro CLI / OpenCode: [[08_AI_BACKEND_CONTRACT]], [[05_SPIN_GLOBE_CONTRACT]], [[06_DATA_CONTRACTS]]
- Antigravity: [[05_SPIN_GLOBE_CONTRACT]], [[09_VIDEO_DEMO_SCRIPT]], [[03_AGENT_ROLES_AND_OWNERSHIP]]
- Open-design Codex: [[17_OPEN_DESIGN_BRIEF]], [[18_OPEN_DESIGN_WORKFLOW]], [[09_VIDEO_DEMO_SCRIPT]], [[03_AGENT_ROLES_AND_OWNERSHIP]]
- Cursor / QA: [[04_TASK_BOARD]], [[09_VIDEO_DEMO_SCRIPT]], [[14_SUBMISSION_CHECKLIST]]

## Source Files

Original planning files in the workspace:

- `хакатон_идея.md`
- `хакатон_план.md`

Do not make agents read those entire files during the hackathon unless they need deep context. Use this vault first.

## CLI Prompts

Initial prompts for terminal agents live in [[16_CLI_START_PROMPTS]].
