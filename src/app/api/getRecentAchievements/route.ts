import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

// 60s TTL — achievements are time-sensitive; 5 min was too long and served
// stale data when user earned achievements and immediately refreshed the page
const TTL = 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;

  const data = await withCache(`recentAch:${id}`, TTL, async () => {
    // 14-day window — small enough that c=500 cap is never exceeded for any user,
    // ensuring the NEWEST achievements are always included regardless of API sort order
    const raw = await fetch(
      `https://retroachievements.org/API/API_GetUserRecentAchievements.php?u=${rausername}&y=${raid}&m=20160&c=500`,
    ).then((r) => r.json())
    if (!Array.isArray(raw)) return raw
    return (raw as { Date: string }[]).sort(
      (a, b) => new Date(b.Date.replace(' ', 'T')).getTime() - new Date(a.Date.replace(' ', 'T')).getTime(),
    )
  });

  return NextResponse.json(data);
}
