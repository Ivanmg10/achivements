import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const publicKey = request.nextUrl.searchParams.get("publicKey");
  const count = request.nextUrl.searchParams.get("count");

  const response = await fetch(
    `https://retroachievements.org/API/API_GetUserWantToPlayList.php?u=${username}&y=${publicKey}`,
  );
  const data = await response.json();
  return NextResponse.json(data);
}
