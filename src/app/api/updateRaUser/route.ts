import { NextResponse } from "next/server";
import { requireSession } from '@/lib/apiAuth'
import pool from "@/lib/db";
import { fetchRaProfile, validRaCredentials, type RaProfileResult } from "@/lib/raProfile";
import { saveRaLink } from "@/lib/platformLinks";
import { forgetUser } from "@/lib/userRecord";
import { onPlatformLinked } from "@/lib/scoreRefresh";

function refused(result: Extract<RaProfileResult, { ok: false }>) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

/** Links an RA account: { username, apiKey }. Answers with the profile RA returned. */
export async function POST(req: Request) {
  const auth = await requireSession({ error: 'Unauthorized' })
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null);
  const { username, apiKey } = (body ?? {}) as { username?: unknown; apiKey?: unknown };
  if (!validRaCredentials(username, apiKey)) {
    return NextResponse.json({ error: "username and apiKey are required" }, { status: 400 });
  }

  const fetched = await fetchRaProfile(username.trim(), (apiKey as string).trim());
  if (!fetched.ok) return refused(fetched);
  const { profile } = fetched;

  try {
    await saveRaLink(auth.id, profile, (apiKey as string).trim());
  } catch (err) {
    // raid is unique: the same key already links another account here.
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "key-in-use" }, { status: 409 });
    }
    console.error("[updateRaUser POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  forgetUser(auth.id);
  await onPlatformLinked(Number(auth.id), "ra");

  return NextResponse.json(profile);
}

/** Refreshes the stored RA profile (points, picture…) with the linked username and key. */
export async function PUT() {
  const auth = await requireSession({ error: 'Unauthorized' })
  if (!auth.ok) return auth.response
  const { rausername, raid } = auth.user;
  if (!rausername || !raid) {
    return NextResponse.json({ error: "No RA account linked" }, { status: 400 });
  }

  const fetched = await fetchRaProfile(rausername, raid);
  if (!fetched.ok) return refused(fetched);

  try {
    await pool.query(`UPDATE users SET "raUser" = $1 WHERE id = $2`, [
      JSON.stringify(fetched.profile),
      auth.id,
    ]);
  } catch (err) {
    console.error("[updateRaUser PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  forgetUser(auth.id);

  return NextResponse.json(fetched.profile);
}
