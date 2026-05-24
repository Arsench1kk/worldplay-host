import { NextResponse } from "next/server";

import { createRoom } from "@/lib/server/roomStore";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      playerName?: unknown;
      playerCount?: unknown;
      vibe?: unknown;
    };
    const room = await createRoom({
      playerName: body.playerName,
      playerCount: body.playerCount,
      vibe: body.vibe,
    });

    return NextResponse.json(
      {
        room,
        player: room.players.find((player) => player.isHost) ?? room.players[0],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[/api/rooms] create error", error);
    return NextResponse.json(
      { error: "Could not create room" },
      { status: 500 },
    );
  }
}
