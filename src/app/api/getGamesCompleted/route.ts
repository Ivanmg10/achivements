import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

const TTL = 10 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;

  const data = await withCache(`gamesCompleted:${id}`, TTL, () =>
    fetch(
      `https://retroachievements.org/API/API_GetUserCompletedGames.php?u=${rausername}&y=${raid}`,
    ).then((r) => r.json()),
  );

  return NextResponse.json(data);
}
