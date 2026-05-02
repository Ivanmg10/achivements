import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

const TTL = 5 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;

  const data = await withCache(`recentlyPlayed:${id}`, TTL, () =>
    fetch(
      `https://retroachievements.org/API/API_GetUserRecentlyPlayedGames.php?u=${rausername}&y=${raid}&c=500`,
    ).then((r) => r.json()),
  );

  return NextResponse.json(data);
}
