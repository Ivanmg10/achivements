import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions); // 👈
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { raUser } = await req.json();

  await pool.query(`UPDATE users SET "raUser" = $1 WHERE id = $2`, [
    JSON.stringify(raUser),
    session.user.id,
  ]);

  return NextResponse.json({ ok: true });
}
