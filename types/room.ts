import type { CultureId, GameId, PartyVibe } from "./culture";

export type RoomEventKind =
  | "room_created"
  | "player_joined"
  | "spin_completed"
  | "game_started"
  | "game_event";

export type RoomPlayer = {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  joinedAt: string;
  lastSeenAt: string;
};

export type RoomEvent = {
  id: string;
  kind: RoomEventKind;
  playerId?: string;
  playerName?: string;
  summary: string;
  createdAt: string;
};

export type RoomSnapshot = {
  id: string;
  code: string;
  playerCount: number;
  vibe: PartyVibe;
  selectedCultureId?: CultureId;
  selectedGameId?: GameId;
  createdAt: string;
  updatedAt: string;
  players: RoomPlayer[];
  recentEvents: RoomEvent[];
};

export type ProductPulse = {
  activeRooms: number;
  totalRooms: number;
  totalPlayers: number;
  totalEvents: number;
  dailyChallenge: {
    gameId: GameId;
    title: string;
    country: string;
    prompt: string;
  };
};
