/**
 * WorldPlay Host — room store backed by Postgres.
 *
 * Replaces the local node:sqlite proof with an async Postgres adapter
 * that works on Vercel with Neon or Supabase.
 *
 * All exported functions are async. Route handlers must await them.
 *
 * SECURITY: server-only. DATABASE_URL is never sent to the client.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { getSQL, ensureSchema } from "@/lib/server/db";
import { gameCatalog } from "@/data/gameCatalog";
import type { CultureId, GameId, PartyVibe } from "@/types/culture";
import type {
  ProductPulse,
  RoomEvent,
  RoomEventKind,
  RoomPlayer,
  RoomSnapshot,
} from "@/types/room";

// ---------------------------------------------------------------------------
// Internal DB row shapes
// Postgres returns TIMESTAMPTZ as Date objects and BOOLEAN as booleans.
// ---------------------------------------------------------------------------

type RoomRow = {
  id: string;
  code: string;
  player_count: number;
  vibe: string;
  selected_culture_id: string | null;
  selected_game_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type PlayerRow = {
  id: string;
  name: string;
  color: string;
  is_host: boolean;
  joined_at: Date;
  last_seen_at: Date;
};

type EventRow = {
  id: string;
  kind: string;
  player_id: string | null;
  player_name: string | null;
  summary: string;
  created_at: Date;
};

type CountRow = { count: number };

// ---------------------------------------------------------------------------
// Input sanitisers (identical to SQLite version)
// ---------------------------------------------------------------------------

function safeName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  return name.slice(0, 28) || "Guest Player";
}

function safePlayerCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Math.min(12, Math.max(2, Number.isFinite(n) ? Math.round(n) : 4));
}

function safeVibe(value: unknown): PartyVibe {
  const allowed: PartyVibe[] = [
    "funny",
    "chaotic",
    "cultural",
    "family",
    "strategic",
    "deep",
  ];
  return allowed.includes(value as PartyVibe) ? (value as PartyVibe) : "funny";
}

function colorForIndex(index: number): string {
  const colors = ["amber", "teal", "rose", "violet", "leaf", "sky"];
  return colors[index % colors.length];
}

function makeCode(): string {
  // 32-character alphabet avoids ambiguous chars (0/O, 1/I)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

async function findRoomByCode(code: string): Promise<RoomRow | undefined> {
  const sql = getSQL();
  const rows = await sql<RoomRow[]>`
    SELECT id, code, player_count, vibe,
           selected_culture_id, selected_game_id,
           created_at, updated_at
    FROM   rooms
    WHERE  code = ${code.trim().toUpperCase()}
  `;
  return rows[0];
}

async function toSnapshot(room: RoomRow): Promise<RoomSnapshot> {
  const sql = getSQL();

  const players = await sql<PlayerRow[]>`
    SELECT id, name, color, is_host, joined_at, last_seen_at
    FROM   room_players
    WHERE  room_id = ${room.id}
    ORDER  BY joined_at ASC
  `;

  const events = await sql<EventRow[]>`
    SELECT id, kind, player_id, player_name, summary, created_at
    FROM   room_events
    WHERE  room_id = ${room.id}
    ORDER  BY created_at DESC
    LIMIT  8
  `;

  return {
    id: room.id,
    code: room.code,
    playerCount: room.player_count,
    vibe: room.vibe as PartyVibe,
    selectedCultureId:
      room.selected_culture_id !== null
        ? (room.selected_culture_id as CultureId)
        : undefined,
    selectedGameId:
      room.selected_game_id !== null
        ? (room.selected_game_id as GameId)
        : undefined,
    createdAt: room.created_at.toISOString(),
    updatedAt: room.updated_at.toISOString(),
    players: players.map(
      (p): RoomPlayer => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isHost: p.is_host,
        joinedAt: p.joined_at.toISOString(),
        lastSeenAt: p.last_seen_at.toISOString(),
      }),
    ),
    recentEvents: events.map(
      (e): RoomEvent => ({
        id: e.id,
        kind: e.kind as RoomEventKind,
        playerId: e.player_id ?? undefined,
        playerName: e.player_name ?? undefined,
        summary: e.summary,
        createdAt: e.created_at.toISOString(),
      }),
    ),
  };
}

async function insertEvent(input: {
  roomId: string;
  playerId?: string;
  playerName?: string;
  kind: RoomEventKind;
  summary: string;
  payload?: unknown;
}): Promise<void> {
  const sql = getSQL();
  const now = new Date();
  const payload =
    input.payload !== null && typeof input.payload === "object"
      ? input.payload
      : {};
  const payloadJson = JSON.stringify(payload);

  await sql`
    INSERT INTO room_events
      (id, room_id, player_id, player_name, kind, summary, payload, created_at)
    VALUES (
      ${randomUUID()},
      ${input.roomId},
      ${input.playerId ?? null},
      ${input.playerName ?? null},
      ${input.kind},
      ${input.summary.slice(0, 180)},
      ${payloadJson}::jsonb,
      ${now}
    )
  `;
}

// ---------------------------------------------------------------------------
// Exported store functions (all async — route handlers must await)
// ---------------------------------------------------------------------------

export async function createRoom(input: {
  playerName: unknown;
  playerCount: unknown;
  vibe: unknown;
}): Promise<RoomSnapshot> {
  await ensureSchema();
  const sql = getSQL();

  const roomId = randomUUID();
  const playerId = randomUUID();
  const now = new Date();
  const playerName = safeName(input.playerName);
  const playerCount = safePlayerCount(input.playerCount);
  const vibe = safeVibe(input.vibe);

  // Generate a collision-free code (collisions are astronomically rare
  // but we check anyway for correctness).
  let code = makeCode();
  for (let attempt = 0; attempt < 10; attempt++) {
    const existing = await findRoomByCode(code);
    if (!existing) break;
    code = makeCode();
  }

  await sql`
    INSERT INTO rooms
      (id, code, player_count, vibe,
       selected_culture_id, selected_game_id, created_at, updated_at)
    VALUES (
      ${roomId}, ${code}, ${playerCount}, ${vibe},
      NULL, NULL, ${now}, ${now}
    )
  `;

  await sql`
    INSERT INTO room_players
      (id, room_id, name, color, is_host, joined_at, last_seen_at)
    VALUES (
      ${playerId}, ${roomId}, ${playerName},
      ${colorForIndex(0)}, true, ${now}, ${now}
    )
  `;

  await insertEvent({
    roomId,
    playerId,
    playerName,
    kind: "room_created",
    summary: `${playerName} opened a party room.`,
    payload: { code },
  });

  const room = await findRoomByCode(code);
  return toSnapshot(room!);
}

export async function joinRoom(input: {
  code: unknown;
  playerName: unknown;
}): Promise<RoomSnapshot | undefined> {
  await ensureSchema();
  const sql = getSQL();

  const code =
    typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
  const room = await findRoomByCode(code);
  if (!room) return undefined;

  const playerName = safeName(input.playerName);
  const now = new Date();
  const playerId = randomUUID();

  const [{ count: existingCount }] = await sql<CountRow[]>`
    SELECT COUNT(*)::int AS count
    FROM   room_players
    WHERE  room_id = ${room.id}
  `;

  await sql`
    INSERT INTO room_players
      (id, room_id, name, color, is_host, joined_at, last_seen_at)
    VALUES (
      ${playerId}, ${room.id}, ${playerName},
      ${colorForIndex(existingCount)}, false, ${now}, ${now}
    )
  `;

  await sql`
    UPDATE rooms
    SET    updated_at = ${now}
    WHERE  id = ${room.id}
  `;

  await insertEvent({
    roomId: room.id,
    playerId,
    playerName,
    kind: "player_joined",
    summary: `${playerName} joined the room.`,
    payload: { code },
  });

  return getRoomSnapshot(code);
}

export async function getRoomSnapshot(
  code: string,
): Promise<RoomSnapshot | undefined> {
  await ensureSchema();
  const room = await findRoomByCode(code);
  return room ? toSnapshot(room) : undefined;
}

export async function recordRoomEvent(input: {
  code: unknown;
  playerId?: unknown;
  playerName?: unknown;
  kind: unknown;
  summary?: unknown;
  payload?: unknown;
}): Promise<RoomSnapshot | undefined> {
  await ensureSchema();
  const sql = getSQL();

  const code =
    typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
  const room = await findRoomByCode(code);
  if (!room) return undefined;

  const validKinds: RoomEventKind[] = [
    "spin_completed",
    "game_started",
    "game_event",
  ];
  const kind: RoomEventKind = validKinds.includes(input.kind as RoomEventKind)
    ? (input.kind as RoomEventKind)
    : "game_event";

  const payload =
    typeof input.payload === "object" && input.payload !== null
      ? (input.payload as Record<string, unknown>)
      : {};
  const playerId =
    typeof input.playerId === "string" ? input.playerId : undefined;
  const playerName =
    typeof input.playerName === "string"
      ? safeName(input.playerName)
      : undefined;
  const summary =
    typeof input.summary === "string" && input.summary.trim()
      ? input.summary.trim()
      : "Room event recorded.";
  const now = new Date();

  if (kind === "spin_completed" || kind === "game_started") {
    const newCultureId =
      typeof payload.cultureId === "string"
        ? payload.cultureId
        : room.selected_culture_id;
    const newGameId =
      typeof payload.gameId === "string"
        ? payload.gameId
        : room.selected_game_id;

    await sql`
      UPDATE rooms
      SET    selected_culture_id = ${newCultureId},
             selected_game_id    = ${newGameId},
             updated_at          = ${now}
      WHERE  id = ${room.id}
    `;
  } else {
    await sql`
      UPDATE rooms SET updated_at = ${now} WHERE id = ${room.id}
    `;
  }

  await insertEvent({
    roomId: room.id,
    playerId,
    playerName,
    kind,
    summary,
    payload,
  });

  return getRoomSnapshot(code);
}

export async function getProductPulse(): Promise<ProductPulse> {
  await ensureSchema();
  const sql = getSQL();

  const [{ count: totalRooms }] = await sql<CountRow[]>`
    SELECT COUNT(*)::int AS count FROM rooms
  `;

  const [{ count: totalPlayers }] = await sql<CountRow[]>`
    SELECT COUNT(*)::int AS count FROM room_players
  `;

  const [{ count: totalEvents }] = await sql<CountRow[]>`
    SELECT COUNT(*)::int AS count FROM room_events
  `;

  const [{ count: activeRooms }] = await sql<CountRow[]>`
    SELECT COUNT(*)::int AS count
    FROM   rooms
    WHERE  updated_at >= NOW() - INTERVAL '20 minutes'
  `;

  const playableGames = gameCatalog.filter(
    (g) => g.implementationStatus === "playable",
  );
  const dayIndex = Math.floor(Date.now() / 86_400_000) % playableGames.length;
  const dailyGame = playableGames[dayIndex];

  return {
    activeRooms,
    totalRooms,
    totalPlayers,
    totalEvents,
    dailyChallenge: {
      gameId: dailyGame.id,
      title: dailyGame.title,
      country: dailyGame.country,
      prompt: `Today: start ${dailyGame.title} and let the AI Host run one round.`,
    },
  };
}
