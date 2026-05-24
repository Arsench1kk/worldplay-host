# Hackathon Lock

## Project

**WorldPlay Host**

## One-Liner

**Spin the globe. Discover a real folk game. Let an AI host teach, run, and remix it for your group.**

## Core Idea

AI host for folk and party games from around the world.

Users do not just pick a generic game. They spin a globe, land on a culture, receive a cultural pack, hear from an AI host, and start playing.

## Target MVP

```txt
Home / Globe screen
Player count selector
Vibe selector
Spin the Globe
Culture arrival screen
AI Host panel
Recommended games
At least 4 playable games
Fallback content
Responsive UI
60-second demo video
```

## Default Mode

```txt
Same-device pass-and-play
```

Local party mode is the primary product: one device on the table, live friends in the same room.

Remote friends mode is secondary: same social games, but connected by room code.

AI players are third: fill missing seats, demo turns, or support solo testing.

Room mode must not block local play.

Core demo now works, so lightweight room mode is allowed and external Postgres is critical for live deploy:

```txt
guest name
room code
server-backed players list
room events
Neon/Supabase Postgres for live deploy
no email/password accounts
no profile persistence
no long-term player history
```

## AI Roles

```txt
AI Host      -> explains rules naturally
AI Curator   -> recommends games for the group
AI Generator -> creates words, clues, prompts, phrases
AI Referee   -> judges answers or comments on gameplay
AI Player    -> fills missing player slots when useful
```

## Target Video Moment

At around 30 seconds:

```txt
The globe lands on a culture, a passport stamp appears, the AI Host introduces the pack, and a recommended game starts.
```

## Cut Immediately

```txt
heavy account auth
profile persistence
long-term player history
payment
full country catalog
native mobile
complex 3D globe
paid TTS dependency
custom physics engine
```
