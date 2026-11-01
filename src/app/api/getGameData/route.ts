import { raUnavailable } from '@/lib/raFailure'
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireViewerApiKey } from "@/lib/apiAuth";
import { cachedJson } from "@/lib/httpCache";
import { cachedGame, GAME_TTL_MS } from "@/lib/raGame";

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
    const data = await cachedGame(gameId, auth.apiKey);
    return cachedJson(data, GAME_TTL_MS);
  } catch (err) {
    return raUnavailable(err)
  }
}
