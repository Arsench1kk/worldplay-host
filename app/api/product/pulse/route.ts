import { NextResponse } from "next/server";

import { getProductPulse } from "@/lib/server/roomStore";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const pulse = await getProductPulse();
    return NextResponse.json(pulse, { status: 200 });
  } catch (error) {
    console.error("[/api/product/pulse] error", error);
    // Return a safe zero-state rather than a 500 — the pulse widget
    // is informational and should never break the demo.
    return NextResponse.json(
      {
        activeRooms: 0,
        totalRooms: 0,
        totalPlayers: 0,
        totalEvents: 0,
        dailyChallenge: {
          gameId: "the-hat",
          title: "The Hat",
          country: "Global Party Table",
          prompt: "Today: start The Hat and let the AI Host run one round.",
        },
      },
      { status: 200 },
    );
  }
}
