import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withCache } from "@/lib/raCache";
import { cachedJson } from "@/lib/httpCache";
import { getGame } from "@/lib/raClient";

const TTL = 4 * 60 * 60 * 1000;
const publicKey = process.env.RA_API_KEY ?? '';

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId");

  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: "Invalid gameId" }, { status: 400 });
  }

  try {
    const data = await withCache(
      `gameData_v2:${gameId}`,
      TTL,
      () => getGame(gameId, publicKey),
      (d) => d !== null && typeof d === 'object' && 'ID' in d,
    );
    return cachedJson(data, TTL);
  } catch {
    return NextResponse.json({ message: "RA service unavailable" }, { status: 503 });
  }
}
