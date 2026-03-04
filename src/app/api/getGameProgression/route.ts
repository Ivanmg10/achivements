import { NextResponse } from "next/server";

export async function GET() {
  const username = "PalmeraMiami";
  const publicKey = "dSPZGidkZDLw1UaiUOWRk4jBiTbku6va";

  const response = await fetch(
    `https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?g=14402&u=${username}&y=${publicKey}&g=5578`,
  );
  const data = await response.json();
  return NextResponse.json(data);
}
