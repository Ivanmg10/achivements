import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const gameId = request.nextUrl.searchParams.get("gameId");
  const username = session.user.rausername;
  const publicKey = session.user.raid;

  const response = await fetch(
    `https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?u=${username}&y=${publicKey}&g=${gameId}`,
  );

  const data = await response.json();

  return NextResponse.json(data);
}
