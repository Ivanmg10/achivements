import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { authOptions } from "@/lib/authOptions";
import { fetchRaProfile, validRaCredentials, type RaProfileResult } from "@/lib/raProfile";
import { forgetUser } from "@/lib/userRecord";

function refused(result: Extract<RaProfileResult, { ok: false }>) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

/** Links an RA account: { username, apiKey }. Answers with the profile RA returned. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { username, apiKey } = (body ?? {}) as { username?: unknown; apiKey?: unknown };
  if (!validRaCredentials(username, apiKey)) {
    return NextResponse.json({ error: "username and apiKey are required" }, { status: 400 });
  }

  const fetched = await fetchRaProfile(username.trim(), (apiKey as string).trim());
  if (!fetched.ok) return refused(fetched);
  const { profile } = fetched;

  try {
    await pool.query(
      `UPDATE users SET "raUser" = $1, rausername = $2, raid = $3 WHERE id = $4`,
      [JSON.stringify(profile), profile.User, (apiKey as string).trim(), session.user.id],
    );
  } catch (err) {
    // raid is unique: the same key already links another account here.
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "key-in-use" }, { status: 409 });
    }
    console.error("[updateRaUser POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  forgetUser(session.user.id);

  return NextResponse.json(profile);
}

/** Refreshes the stored RA profile (points, picture…) with the linked username and key. */
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { rausername, raid } = session.user;
  if (!rausername || !raid) {
    return NextResponse.json({ error: "No RA account linked" }, { status: 400 });
  }

  const fetched = await fetchRaProfile(rausername, raid);
  if (!fetched.ok) return refused(fetched);

  try {
    await pool.query(`UPDATE users SET "raUser" = $1 WHERE id = $2`, [
      JSON.stringify(fetched.profile),
      session.user.id,
    ]);
  } catch (err) {
    console.error("[updateRaUser PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  forgetUser(session.user.id);

  return NextResponse.json(fetched.profile);
}
