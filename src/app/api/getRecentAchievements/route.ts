import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withCache } from "@/lib/raCache";

const TTL = 60 * 1000;

function sortDesc(arr: { Date: string }[]) {
  return [...arr].sort(
    (a, b) =>
      new Date(b.Date.replace(" ", "T")).getTime() -
      new Date(a.Date.replace(" ", "T")).getTime(),
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { rausername, raid, id } = session.user;

  const data = await withCache(`recentAch:${id}`, TTL, async () => {
    const raw = await fetch(
      `https://retroachievements.org/API/API_GetUserRecentAchievements.php?u=${rausername}&y=${raid}&m=20160&c=500`,
    ).then((r) => r.json());

    // Log raw response shape so we can diagnose format issues
    console.log(
      "[recentAch] type:", typeof raw,
      "| isArray:", Array.isArray(raw),
      "| length/keys:", Array.isArray(raw) ? raw.length : Object.keys(raw ?? {}).slice(0, 5),
      "| sample:", JSON.stringify(raw).slice(0, 200),
    );

    if (Array.isArray(raw)) return sortDesc(raw);

    // RA API sometimes wraps results — handle common patterns
    if (raw?.Results && Array.isArray(raw.Results)) return sortDesc(raw.Results);
    if (raw?.Data && Array.isArray(raw.Data)) return sortDesc(raw.Data);

    return [];
  });

  return NextResponse.json(data);
}
