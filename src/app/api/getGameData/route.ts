import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withCache } from "@/lib/raCache";

const TTL = 60 * 60 * 1000;
const publicKey = process.env.RA_API_KEY;

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId");

  const data = await withCache(`gameData:${gameId}`, TTL, () =>
    fetch(
      `https://retroachievements.org/API/API_GetGame.php?i=${gameId}&y=${publicKey}`,
    ).then((r) => r.json()),
  );

  return NextResponse.json(data);
}
