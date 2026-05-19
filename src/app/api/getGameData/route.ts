import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withCache } from "@/lib/raCache";
import { fetchRA } from "@/lib/fetchRA";

const TTL = 4 * 60 * 60 * 1000;
const publicKey = process.env.RA_API_KEY;

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId");

  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: "Invalid gameId" }, { status: 400 });
  }

  try {
    const data = await withCache(
      `gameData_v2:${gameId}`,
      TTL,
      () => fetchRA(`https://retroachievements.org/API/API_GetGame.php?i=${gameId}&y=${publicKey}`),
      (d) => d !== null && typeof d === 'object' && 'ID' in d,
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "RA service unavailable" }, { status: 503 });
  }
}
