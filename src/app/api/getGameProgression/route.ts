import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withCache } from "@/lib/raCache";
import { cachedJson } from "@/lib/httpCache";
import { requireRaSession } from "@/lib/apiAuth";
import { getGameInfoAndUserProgress } from "@/lib/raClient";

const TTL = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const auth = await requireRaSession();
  if (!auth.ok) return auth.response;
  const { id, rausername, raid } = auth.session;

  const gameId = request.nextUrl.searchParams.get("gameId");
  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: "Invalid gameId" }, { status: 400 });
  }

  try {
    const data = await withCache(
      `gameProgression_v2:${id}:${gameId}`,
      TTL,
      () => getGameInfoAndUserProgress(rausername, raid, gameId),
      (d) => d !== null && typeof d === 'object' && 'ID' in d,
    );

    if (!data || typeof data !== 'object' || !('ID' in data)) {
      return NextResponse.json({ message: "Game not found" }, { status: 404 });
    }
    return cachedJson(data, TTL);
  } catch {
    return NextResponse.json({ message: "RA service unavailable" }, { status: 503 });
  }
}
