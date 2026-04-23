import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { theme } = await req.json();
  if (!theme) {
    return NextResponse.json({ message: "theme requerido" }, { status: 400 });
  }

  await pool.query(`UPDATE users SET theme = $1 WHERE id = $2`, [
    theme,
    session.user.id,
  ]);

  return NextResponse.json({ ok: true });
}
