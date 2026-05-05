import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    // Registration is disabled when REGISTER_TOKEN is not set
    const expectedToken = process.env.REGISTER_TOKEN;
    if (!expectedToken) {
      return NextResponse.json({ error: "Registration is disabled" }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, registerToken } = body as {
      username?: string;
      password?: string;
      registerToken?: string;
    };

    if (registerToken !== expectedToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "username y password son obligatorios" },
        { status: 400 },
      );
    }

    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username: 3–20 caracteres, solo letras, números y guión bajo" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Username ya en uso" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, theme)
       VALUES ($1, $2, 'dark')
       RETURNING id, username, email, theme, avatar, admin`,
      [username, hashedPassword],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("[users POST]", err);
    return NextResponse.json(
      { error: "Error creando usuario" },
      { status: 500 },
    );
  }
}
