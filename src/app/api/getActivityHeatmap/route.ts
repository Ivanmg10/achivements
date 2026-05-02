import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

// 30-min TTL — historical heatmap data doesn't need to be real-time
const TTL = 30 * 60 * 1000;
// 182 days in minutes (desktop heatmap max)
const LOOKBACK_MINUTES = 182 * 24 * 60;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;

  const data = await withCache(`activityHeatmap:${id}`, TTL, async () => {
    const raw = await fetch(
      `https://retroachievements.org/API/API_GetUserRecentAchievements.php?u=${rausername}&y=${raid}&m=${LOOKBACK_MINUTES}&c=2000`,
    ).then((r) => r.json());
    if (!Array.isArray(raw)) return [];
    return raw;
  });

  return NextResponse.json(data);
}
