import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
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
    `https://retroachievements.org/API/API_GetUserProfile.php?u=${username}&y=${publicKey}`,
  );
  const data = await response.json();

  return NextResponse.json(data);
}

// Used by RaLoginModal to validate RA credentials before linking
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { username, apiKey } = await req.json();
  if (!username || !apiKey) {
    return NextResponse.json(
      { message: "username y apiKey son obligatorios" },
      { status: 400 },
    );
  }

  const response = await fetch(
    `https://retroachievements.org/API/API_GetUserProfile.php?u=${username}&y=${apiKey}`,
  );
  const data = await response.json();

  return NextResponse.json(data);
}
