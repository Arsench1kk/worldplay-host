# Agent Instructions

This workspace uses `WorldPlayHost_Vault` as the shared source of truth.

Before working, read:

1. `WorldPlayHost_Vault/00_START_HERE.md`
2. `WorldPlayHost_Vault/01_HACKATHON_LOCK.md`
3. `WorldPlayHost_Vault/02_CURRENT_STATUS.md`
4. `WorldPlayHost_Vault/03_AGENT_ROLES_AND_OWNERSHIP.md`
5. The contract file for your lane.

## Project

WorldPlay Host: an AI-powered web platform where players spin the globe, discover a real folk or party game, and let an AI host teach, run, and remix it.

## Central Rule

Spin the Globe must work locally without live AI, multiplayer, database, or completed games.

## Ownership

- This desktop Codex thread: project brain, orchestrator, task router, integration judge.
- Codex: contracts, registry, app shell, integration, build.
- Claude Code: playable game engines.
- Kiro CLI / OpenCode: AI backend and fallback route.
- Antigravity: visuals, animation, silent-video clarity.
- Open-design Codex: product UI, visual system, demo polish, design QA.
- Cursor / QA: content, README, test checklist, demo script.

Do not change frozen data contracts without Codex approval.

## Open Design

Open Design is a separate local mockup workspace, not the production app.

Server:

```txt
http://127.0.0.1:56181/
```

Source folder:

```txt
/Users/arsenabduhalyk/Projects/DesignLab/open-design
```

Before any Open Design task, summarize target project/folder, files to read, files to edit, and what will not be touched. Do not modify Open Design runtime/source files unless explicitly asked.
