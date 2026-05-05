import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { authOptions } from "@/lib/authOptions";

const REQUIRED_FIELDS = ["ID", "User", "ULID", "UserPic", "TotalPoints"] as const;
const MAX_PAYLOAD_SIZE = 10_000;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { raUser } = body as { raUser?: unknown };

  if (!raUser || typeof raUser !== "object" || Array.isArray(raUser)) {
    return NextResponse.json({ message: "raUser must be an object" }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((f) => !(f in (raUser as Record<string, unknown>)));
  if (missing.length > 0) {
    return NextResponse.json(
      { message: `raUser missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const serialized = JSON.stringify(raUser);
  if (serialized.length > MAX_PAYLOAD_SIZE) {
    return NextResponse.json({ message: "raUser payload too large" }, { status: 400 });
  }

  await pool.query(`UPDATE users SET "raUser" = $1 WHERE id = $2`, [
    serialized,
    session.user.id,
  ]);

  return NextResponse.json({ ok: true });
}
