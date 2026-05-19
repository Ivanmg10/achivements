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

  const { rausername, raid, id } = session.user;
  if (!rausername || !raid) {
    return NextResponse.json({});
  }

  const gameIdsParam = request.nextUrl.searchParams.get("gameIds");
  if (!gameIdsParam) return NextResponse.json({});

  const gameIds = gameIdsParam.split(",").map(Number).filter(Boolean);

  async function fetchGame(gameId: number): Promise<[number, string | null]> {
    try {
      const data = await withCache(
        `gameProgression_v2:${id}:${gameId}`,
        TTL,
        () => fetchRA(
          `https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?u=${rausername}&y=${raid}&g=${gameId}`,
        ),
        (d) => d !== null && typeof d === 'object' && 'ID' in d,
      );

      const achievements: Record<string, { DateEarned?: string; DateEarnedHardcore?: string }> =
        (data as { Achievements?: Record<string, { DateEarned?: string; DateEarnedHardcore?: string }> } | null)?.Achievements ?? {};
      let lastPlayed: string | null = null;
      for (const ach of Object.values(achievements)) {
        const d = ach.DateEarnedHardcore ?? ach.DateEarned ?? null;
        if (d && (!lastPlayed || d > lastPlayed)) lastPlayed = d;
      }
      return [gameId, lastPlayed];
    } catch {
      return [gameId, null];
    }
  }

  const BATCH = 5;
  const results: [number, string | null][] = [];
  for (let i = 0; i < gameIds.length; i += BATCH) {
    const batch = await Promise.all(gameIds.slice(i, i + BATCH).map(fetchGame));
    results.push(...batch);
  }

  return NextResponse.json(Object.fromEntries(results));
}
