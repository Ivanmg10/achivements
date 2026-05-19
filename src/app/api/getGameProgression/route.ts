import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";
import { fetchRA } from "@/lib/fetchRA";

const TTL = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const gameId = request.nextUrl.searchParams.get("gameId");
  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: "Invalid gameId" }, { status: 400 });
  }

  const { rausername, raid, id } = session.user;
  if (!rausername || !raid) {
    return NextResponse.json({ message: "No RA account linked" }, { status: 400 });
  }

  try {
    const data = await withCache(
      `gameProgression_v2:${id}:${gameId}`,
      TTL,
      () => fetchRA(
        `https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?u=${rausername}&y=${raid}&g=${gameId}`,
      ),
      (d) => d !== null && typeof d === 'object' && 'ID' in d,
    );

    if (!data || typeof data !== 'object' || !('ID' in data)) {
      return NextResponse.json({ message: "Game not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "RA service unavailable" }, { status: 503 });
  }
}
