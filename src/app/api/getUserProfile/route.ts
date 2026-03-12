import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const publicKey = request.nextUrl.searchParams.get("publicKey");

  console.log(username);
  console.log(publicKey);

  const response = await fetch(
    `https://retroachievements.org/API/API_GetUserProfile.php?u=${username}&y=${publicKey}`,
  );
  const data = await response.json();
  return NextResponse.json(data);
}
