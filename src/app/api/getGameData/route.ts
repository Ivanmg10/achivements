import { NextResponse } from "next/server";

export async function GET() {
  //   const username = "PalmeraMiami";
  const publicKey = "dSPZGidkZDLw1UaiUOWRk4jBiTbku6va";

  const response = await fetch(
    `https://retroachievements.org/API/API_GetGame.php?i=5578&y=${publicKey}`,
  );
  const data = await response.json();
  return NextResponse.json(data);
}
