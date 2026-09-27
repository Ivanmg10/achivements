import { NextResponse } from "next/server";
import { withCache } from "@/lib/raCache";
import { cachedJson } from "@/lib/httpCache";
import { requireRaSession } from "@/lib/apiAuth";
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
