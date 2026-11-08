import { NextResponse } from "next/server";
import { requireSession } from '@/lib/apiAuth'
import pool from "@/lib/db";
import { forgetUser } from "@/lib/userRecord";
import { isTheme } from "@/types/types";

export async function POST(req: Request) {
  try {
    const auth = await requireSession()
    if (!auth.ok) return auth.response

    const { theme } = (await req.json().catch(() => null)) ?? {};
    if (!isTheme(theme)) {
      return NextResponse.json({ message: "theme no válido" }, { status: 400 });
    }

    await pool.query(`UPDATE users SET theme = $1 WHERE id = $2`, [
      theme,
      auth.id,
    ]);

    forgetUser(auth.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[updateTheme POST]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
