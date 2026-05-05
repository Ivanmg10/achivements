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
  if (!rausername || !raid) {
    return NextResponse.json({ message: "No RA account linked" }, { status: 400 });
  }

  try {
    const data = await withCache(`userProfile:${id}`, TTL, () =>
      fetch(
        `https://retroachievements.org/API/API_GetUserProfile.php?u=${rausername}&y=${raid}`,
      ).then((r) => r.json()),
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to fetch RA profile" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { username, apiKey } = body as { username?: unknown; apiKey?: unknown };
  if (typeof username !== "string" || typeof apiKey !== "string" || !username.trim() || !apiKey.trim()) {
    return NextResponse.json(
      { message: "username y apiKey son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const data = await fetch(
      `https://retroachievements.org/API/API_GetUserProfile.php?u=${username.trim()}&y=${apiKey.trim()}`,
    ).then((r) => r.json());

    // Validate RA returned a real user, not an error response
    if (!data || typeof data !== "object" || !("User" in data) || !data.User) {
      return NextResponse.json(
        { message: "RA credentials invalid or user not found" },
        { status: 400 },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to reach RetroAchievements" }, { status: 502 });
  }
}
