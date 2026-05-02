import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

const TTL = 15 * 60 * 1000; // 15 min

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;

  const data = await withCache(`activityHeatmap:${id}`, TTL, async () => {
    const now = Math.floor(Date.now() / 1000);
    const day30 = now - 30 * 24 * 3600;
    const day60 = now - 60 * 24 * 3600;

    // Two parallel calls covering 60 days in 30-day chunks.
    // API_GetAchievementsEarnedBetween queries by date range with no count cap,
    // avoiding the ascending-order + c=500 truncation issue.
    const [chunk1, chunk2] = await Promise.all([
      fetch(
        `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${rausername}&y=${raid}&f=${day30}&t=${now}`,
      ).then((r) => r.json()).catch(() => []),
      fetch(
        `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${rausername}&y=${raid}&f=${day60}&t=${day30}`,
      ).then((r) => r.json()).catch(() => []),
    ]);

    const merged = [
      ...(Array.isArray(chunk1) ? chunk1 : []),
      ...(Array.isArray(chunk2) ? chunk2 : []),
    ];
    return merged;
  });

  return NextResponse.json(data);
}
