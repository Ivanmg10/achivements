import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireViewerApiKey } from "@/lib/apiAuth";
import { withCache } from "@/lib/raCache";
import { cachedJson } from "@/lib/httpCache";
import { getGame } from "@/lib/raClient";

const TTL = 4 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId");

  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: "Invalid gameId" }, { status: 400 });
  }

  // A game's own data is public on RA, but the call still needs a key: the
  // viewer's own, or the shared one. With neither, asking RA with an empty key
  // only bought a 503 per lookup.
  const auth = await requireViewerApiKey();
  if (!auth.ok) return auth.response;

  try {
    const data = await withCache(
      `gameData_v2:${gameId}`,
      TTL,
      () => getGame(gameId, auth.apiKey),
      (d) => d !== null && typeof d === 'object' && 'ID' in d,
    );
    return cachedJson(data, TTL);
  } catch {
    return NextResponse.json({ message: "RA service unavailable" }, { status: 503 });
  }
}
