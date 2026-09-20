import { NextResponse } from "next/server";
import { withCache } from "@/lib/raCache";
import { cachedJson } from "@/lib/httpCache";
import { requireRaSession } from "@/lib/apiAuth";
import { getAchievementsEarnedBetween } from "@/lib/raClient";

const TTL = 15 * 60 * 1000;

export async function GET() {
  const auth = await requireRaSession();
  if (!auth.ok) return auth.response;
  const { id, rausername, raid } = auth.session;

  try {
    const data = await withCache(`activityHeatmap_v3:${id}`, TTL, async () => {
      const now = Math.floor(Date.now() / 1000);
      const day30 = now - 30 * 24 * 3600;
      const day60 = now - 60 * 24 * 3600;

      const [chunk1, chunk2] = await Promise.all([
        getAchievementsEarnedBetween(rausername, raid, day30, now).catch(() => null),
        getAchievementsEarnedBetween(rausername, raid, day60, day30).catch(() => null),
      ]);

      if (!Array.isArray(chunk1) || !Array.isArray(chunk2)) {
        throw new Error('RA_CHUNKS_INVALID')
      }

      return [...chunk1, ...chunk2]
    });
    return cachedJson(data, TTL);
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 });
  }
}
