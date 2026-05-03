import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

const TTL = 15 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;

  let bothChunksValid = false;
  const data = await withCache(`activityHeatmap_v3:${id}`, TTL, async () => {
    const now = Math.floor(Date.now() / 1000);
    const day30 = now - 30 * 24 * 3600;
    const day60 = now - 60 * 24 * 3600;

    const [chunk1, chunk2] = await Promise.all([
      fetch(
        `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${rausername}&y=${raid}&f=${day30}&t=${now}`,
      ).then((r) => r.json()).catch(() => null),
      fetch(
        `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${rausername}&y=${raid}&f=${day60}&t=${day30}`,
      ).then((r) => r.json()).catch(() => null),
    ]);

    bothChunksValid = Array.isArray(chunk1) && Array.isArray(chunk2);
    const toArr = (r: unknown) => (Array.isArray(r) ? r : []);
    return [...toArr(chunk1), ...toArr(chunk2)];
  }, () => bothChunksValid);

  return NextResponse.json(data);
}
