import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { User } from "@/types/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, raId, theme, avatar } = body as Partial<User>;

    if (!username || !password) {
      return NextResponse.json(
        { error: "username y password son obligatorios" },
        { status: 400 },
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query<User>(
      `INSERT INTO "users" (username, password, raId, theme, avatar)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [username, hashedPassword, raId || null, theme || "dark", avatar || null],
    );

    const user = result.rows[0];
    // No devolver la contraseña
    delete user.password;

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error creando usuario" },
      { status: 500 },
    );
  }
}
