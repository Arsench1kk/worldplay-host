import { NextResponse } from "next/server";

import { getRoomSnapshot } from "@/lib/server/roomStore";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await context.params;
  const room = await getRoomSnapshot(code);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json(room, { status: 200 });
}
