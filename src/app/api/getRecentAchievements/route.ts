import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const username = session.user.rausername;
  const publicKey = session.user.raid;

  const response = await fetch(
    `https://retroachievements.org/API/API_GetUserRecentAchievements.php?u=${username}&y=${publicKey}&c=50`,
  );

  const data = await response.json();

  return NextResponse.json(data);
}
