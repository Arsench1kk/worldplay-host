import { NextResponse } from "next/server";

import { recordRoomEvent } from "@/lib/server/roomStore";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const room = await recordRoomEvent({
    code,
    playerId: body.playerId,
    playerName: body.playerName,
    kind: body.kind,
    summary: body.summary,
    payload: body.payload,
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json(room, { status: 200 });
}
