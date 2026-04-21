import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId");
  const publicKey = process.env.RA_API_KEY;

  const response = await fetch(
    `https://retroachievements.org/API/API_GetGame.php?i=${gameId}&y=${publicKey}`,
  );
  const data = await response.json();
  return NextResponse.json(data);
}
