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

  const { rausername, raid, id } = session.user;
  const gameIdsParam = request.nextUrl.searchParams.get("gameIds");
  if (!gameIdsParam) return NextResponse.json({});

  const gameIds = gameIdsParam.split(",").map(Number).filter(Boolean);

  const results = await Promise.all(
    gameIds.map(async (gameId) => {
      const data = await withCache(`gameProgression:${id}:${gameId}`, TTL, () =>
        fetch(
          `https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?u=${rausername}&y=${raid}&g=${gameId}`,
        ).then((r) => r.json()),
      );

      const achievements: Record<string, { DateEarned?: string; DateEarnedHardcore?: string }> = data?.Achievements ?? {};
      let lastPlayed: string | null = null;
      for (const ach of Object.values(achievements)) {
        const d = ach.DateEarnedHardcore ?? ach.DateEarned ?? null;
        if (d && (!lastPlayed || d > lastPlayed)) lastPlayed = d;
      }
      return [gameId, lastPlayed] as const;
    }),
  );

  return NextResponse.json(Object.fromEntries(results));
}
