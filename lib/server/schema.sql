-- WorldPlay Host — Postgres Schema
--
-- Run this once against your Neon / Supabase database before first deploy.
-- The app also auto-creates these tables on first connection (ensureSchema),
-- so manual execution is optional but recommended for production.
--
-- Compatible with: Neon, Supabase, any standard Postgres 14+

-- ── Rooms ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id                  TEXT        PRIMARY KEY,
  code                TEXT        NOT NULL UNIQUE,  -- 6-char guest join code
  player_count        INTEGER     NOT NULL,
  vibe                TEXT        NOT NULL,
  selected_culture_id TEXT,
  selected_game_id    TEXT,
  created_at          TIMESTAMPTZ NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL
);

-- ── Players ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_players (
  id           TEXT        PRIMARY KEY,
  room_id      TEXT        NOT NULL REFERENCES rooms(id),
  name         TEXT        NOT NULL,
  color        TEXT        NOT NULL,
  is_host      BOOLEAN     NOT NULL DEFAULT false,
  joined_at    TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL
);

-- ── Events ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_events (
  id          TEXT        PRIMARY KEY,
  room_id     TEXT        NOT NULL REFERENCES rooms(id),
  player_id   TEXT,
  player_name TEXT,
  kind        TEXT        NOT NULL,   -- room_created | player_joined | spin_completed | game_started | game_event
  summary     TEXT        NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rooms_code        ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_updated_at  ON rooms(updated_at);
CREATE INDEX IF NOT EXISTS idx_players_room_id   ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_events_room_id    ON room_events(room_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON room_events(created_at);
