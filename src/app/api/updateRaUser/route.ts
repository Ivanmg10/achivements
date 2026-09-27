import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { authOptions } from "@/lib/authOptions";
import { getUserProfile } from "@/lib/raClient";
import { forgetUser } from "@/lib/userRecord";

const MAX_PAYLOAD_SIZE = 10_000;
const MAX_FIELD_LENGTH = 100;

type RaProfile = Record<string, unknown> & { User?: unknown };

type Fetched = { ok: true; profile: RaProfile } | { ok: false; response: NextResponse };

/**
 * Asks RA itself for the profile. Nothing about the account is taken from the
 * browser but the username and key: what gets stored is what RA answered.
 */
async function fetchProfile(username: string, apiKey: string): Promise<Fetched> {
  let profile: unknown;
  try {
    profile = await getUserProfile(username, apiKey);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status && status >= 400 && status < 500) {
      return { ok: false, response: NextResponse.json({ error: "ra-invalid" }, { status: 400 }) };
    }
    console.error("[updateRaUser] RA lookup", err);
    return { ok: false, response: NextResponse.json({ error: "ra-unavailable" }, { status: 502 }) };
  }

  if (!profile || typeof profile !== "object" || Array.isArray(profile) || !(profile as RaProfile).User) {
    return { ok: false, response: NextResponse.json({ error: "ra-invalid" }, { status: 400 }) };
  }
  if (JSON.stringify(profile).length > MAX_PAYLOAD_SIZE) {
    return { ok: false, response: NextResponse.json({ error: "ra-invalid" }, { status: 400 }) };
  }
  return { ok: true, profile: profile as RaProfile };
}

/** Links an RA account: { username, apiKey }. Answers with the profile RA returned. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { username, apiKey } = (body ?? {}) as { username?: unknown; apiKey?: unknown };
  if (
    typeof username !== "string" || typeof apiKey !== "string" ||
    !username.trim() || !apiKey.trim() ||
    username.length > MAX_FIELD_LENGTH || apiKey.length > MAX_FIELD_LENGTH
  ) {
    return NextResponse.json({ error: "username and apiKey are required" }, { status: 400 });
  }

  const fetched = await fetchProfile(username.trim(), apiKey.trim());
  if (!fetched.ok) return fetched.response;
  const { profile } = fetched;

  try {
    await pool.query(
      `UPDATE users SET "raUser" = $1, rausername = $2, raid = $3 WHERE id = $4`,
      [JSON.stringify(profile), profile.User, apiKey.trim(), session.user.id],
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

  const fetched = await fetchProfile(rausername, raid);
  if (!fetched.ok) return fetched.response;

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
