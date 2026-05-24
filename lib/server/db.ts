/**
 * Postgres connection singleton for WorldPlay Host.
 *
 * Uses `postgres` (porsager/postgres) — pure Node.js, zero native bindings,
 * compatible with Neon, Supabase, and any standard Postgres provider.
 *
 * SECURITY: server-only. DATABASE_URL is never sent to the client.
 *
 * Quick setup
 * -----------
 * Local:  Add  DATABASE_URL=postgresql://...  to  .env.local
 * Vercel: Add  DATABASE_URL  in Project Settings → Environment Variables
 *
 * Recommended providers
 * ---------------------
 *   Neon     https://neon.tech     (free tier, serverless-friendly pooler)
 *   Supabase https://supabase.com  (free tier, standard Postgres)
 *
 * Connection string format
 * ------------------------
 *   postgresql://user:password@host/dbname?sslmode=require
 *
 * For Neon, use the connection-pooler URL (ends in -pooler.neon.tech) to
 * avoid connection exhaustion on Vercel serverless functions.
 */

import "server-only";
import postgres from "postgres";

// Module-level singleton — reused across warm serverless invocations.
let _sql: postgres.Sql | undefined;

export function getSQL(): postgres.Sql {
  if (_sql) return _sql;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "[WorldPlay Host] DATABASE_URL is not set.\n" +
        "  • Local dev : add DATABASE_URL to .env.local\n" +
        "  • Vercel    : add DATABASE_URL in Project Settings → Environment Variables\n" +
        "  • Format    : postgresql://user:pass@host/dbname?sslmode=require\n" +
        "  • Providers : Neon (neon.tech) or Supabase (supabase.com)"
    );
  }

  _sql = postgres(url, {
    // 1 connection per serverless function instance — prevents pool exhaustion.
    // Neon pooler URL handles the actual connection multiplexing on their side.
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return _sql;
}

// ---------------------------------------------------------------------------
// Schema initialisation (runs once per process / warm instance)
// ---------------------------------------------------------------------------

let _schemaPromise: Promise<void> | undefined;

/**
 * Creates all WorldPlay Host tables if they do not already exist.
 * Safe to call multiple times — guarded by a module-level Promise.
 */
export async function ensureSchema(): Promise<void> {
  if (_schemaPromise) return _schemaPromise;
  _schemaPromise = _initSchema();
  return _schemaPromise;
}

async function _initSchema(): Promise<void> {
  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id                  TEXT        PRIMARY KEY,
      code                TEXT        NOT NULL UNIQUE,
      player_count        INTEGER     NOT NULL,
      vibe                TEXT        NOT NULL,
      selected_culture_id TEXT,
      selected_game_id    TEXT,
      created_at          TIMESTAMPTZ NOT NULL,
      updated_at          TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS room_players (
      id           TEXT        PRIMARY KEY,
      room_id      TEXT        NOT NULL REFERENCES rooms(id),
      name         TEXT        NOT NULL,
      color        TEXT        NOT NULL,
      is_host      BOOLEAN     NOT NULL DEFAULT false,
      joined_at    TIMESTAMPTZ NOT NULL,
      last_seen_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS room_events (
      id          TEXT        PRIMARY KEY,
      room_id     TEXT        NOT NULL REFERENCES rooms(id),
      player_id   TEXT,
      player_name TEXT,
      kind        TEXT        NOT NULL,
      summary     TEXT        NOT NULL,
      payload     JSONB       NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ NOT NULL
    )
  `;

  // Indexes — idempotent
  await sql`CREATE INDEX IF NOT EXISTS idx_rooms_code        ON rooms(code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_rooms_updated_at  ON rooms(updated_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_players_room_id   ON room_players(room_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_room_id    ON room_events(room_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_created_at ON room_events(created_at)`;
}
