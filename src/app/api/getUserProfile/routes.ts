import { NextResponse } from "next/server";

export async function GET() {
  const username = "PalmeraMiami";
  const publicKey = "dSPZGidkZDLw1UaiUOWRk4jBiTbku6va";

  const response = await fetch(
    `https://retroachievements.org/API/API_GetUserProfile.php?u=${username}&y=${publicKey}`,
  );
  const data = await response.text();
  return NextResponse.json({ data });
}
