import { NextResponse } from "next/server";

import { joinRoom } from "@/lib/server/roomStore";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await context.params;
  const body = (await request.json()) as { playerName?: unknown };
  const room = await joinRoom({ code, playerName: body.playerName });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json(
    { room, player: room.players[room.players.length - 1] },
    { status: 200 },
  );
}
