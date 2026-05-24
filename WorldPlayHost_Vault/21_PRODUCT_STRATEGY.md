# Product Strategy

This file protects the product idea from drifting while agents build quickly.

## Core Product

WorldPlay Host is not primarily an online multiplayer game site.

It is an AI host for real social play.

## Play Modes

Priority order:

```txt
1. Local party mode
   One device on a table, live friends in the same room.
   This is the main product and main demo path.

2. Remote friends mode
   Same live friends, but not in the same place.
   Lightweight guest name + room code.
   No heavy accounts.

3. AI players mode
   Fill missing seats, demonstrate example turns, or let a solo user try the game.
   AI players are a supplement, not the core.
```

## What Lightweight Auth Means

Allowed:

```txt
Guest name
Room code
Host badge
Players list
Room events
Server-backed session state
```

Not wanted:

```txt
Email/password signup
Profile pages
Account settings
Long-term personal history
Social graph
```

## Database Priority

External Postgres is now critical for the live product demo.

Use Neon or Supabase Postgres for live deploy. Local SQLite is acceptable only as a fast local proof.

Critical deploy goal:

```txt
Vercel app
DeepSeek env vars
Postgres database env var
Room create/join works on the live link
Product Pulse uses real server database state
```

## Judge-Friendly Game Priority

The next games should be easy for judges to understand without cultural explanation.

Use familiar party mechanics first:

```txt
The Hat / Shapka
Truth or Dare
Spy / Impostor
Taboo / Don't Say It
Charades / Explain-the-word
Never Have I Ever lite
Would You Rather lite
```

Dropped from priority:

```txt
Broken Telephone
```

Reason: it works naturally in person but does not gain enough from being on a site unless it becomes a full Gartic Phone-like product.

These games still fit the WorldPlay Host concept if the AI Host localizes prompts, remixes rules, and recommends variants by culture/vibe.

## Game Fit Criteria

A game is good for WorldPlay if it supports at least two of these:

```txt
Works on one shared device
Easy to explain in 20 seconds
Playable with friends around a table
Can also work in a remote room
AI can generate prompts, judge, coach, or fill a player
Readable in a silent 60-second video
```

## Product Message

Do not pitch this as:

```txt
an encyclopedia of folk games
a generic online multiplayer site
a local-only toy
```

Pitch this as:

```txt
An AI party host that turns any group into a game night, locally or remotely.
```
