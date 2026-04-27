import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

const TTL = 5 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;

  const data = await withCache(`userProfile:${id}`, TTL, () =>
    fetch(
      `https://retroachievements.org/API/API_GetUserProfile.php?u=${rausername}&y=${raid}`,
    ).then((r) => r.json()),
  );

  return NextResponse.json(data);
}

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

  const data = await fetch(
    `https://retroachievements.org/API/API_GetUserProfile.php?u=${username}&y=${apiKey}`,
  ).then((r) => r.json());

  return NextResponse.json(data);
}
