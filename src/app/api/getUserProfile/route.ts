import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withCache } from "@/lib/raCache";
import { cachedJson } from "@/lib/httpCache";
import { requireRaSession, requireSession } from "@/lib/apiAuth";
import { getUserProfile as fetchRaUserProfile } from "@/lib/raClient";

const TTL = 5 * 60 * 1000;

export async function GET() {
  const auth = await requireRaSession();
  if (!auth.ok) return auth.response;
  const { id, rausername, raid } = auth.session;

  try {
    const data = await withCache(
      `userProfile_v1:${id}`,
      TTL,
      () => fetchRaUserProfile(rausername, raid),
      (d) => d !== null && typeof d === 'object' && 'User' in d && !!(d as Record<string, unknown>).User,
    );
    return cachedJson(data, TTL);
  } catch {
    return NextResponse.json({ message: "RA service unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

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
