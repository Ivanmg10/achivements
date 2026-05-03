import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

const TTL = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const gameId = request.nextUrl.searchParams.get("gameId");
  const { rausername, raid, id } = session.user;

  const data = await withCache(
    `gameProgression_v2:${id}:${gameId}`,
    TTL,
    () =>
      fetch(
        `https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?u=${rausername}&y=${raid}&g=${gameId}`,
      )
        .then((r) => r.json())
        .catch(() => null),
    (d) => d !== null && typeof d === 'object' && 'ID' in d,
  );

  if (data === null) return NextResponse.json({ message: "Game not found" }, { status: 404 });
  return NextResponse.json(data);
}
