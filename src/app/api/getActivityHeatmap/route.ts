import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";
import { fetchRA } from "@/lib/fetchRA";

const TTL = 15 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;
  if (!rausername || !raid) {
    return NextResponse.json({ message: 'No RA account linked' }, { status: 400 });
  }

  try {
    const data = await withCache(`activityHeatmap_v3:${id}`, TTL, async () => {
      const now = Math.floor(Date.now() / 1000);
      const day30 = now - 30 * 24 * 3600;
      const day60 = now - 60 * 24 * 3600;

      const [chunk1, chunk2] = await Promise.all([
        fetchRA(
          `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${rausername}&y=${raid}&f=${day30}&t=${now}`,
        ).catch(() => null),
        fetchRA(
          `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${rausername}&y=${raid}&f=${day60}&t=${day30}`,
        ).catch(() => null),
      ]);

      if (!Array.isArray(chunk1) || !Array.isArray(chunk2)) {
        throw new Error('RA_CHUNKS_INVALID')
      }

      return [...chunk1, ...chunk2]
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 });
  }
}
