import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { allowAttempt, clientAddress } from "@/lib/attemptLimit";

export async function POST(req: NextRequest) {
  try {
    // Anyone can sign up. Set REGISTRATION_OPEN=false to close the door.
    if (process.env.REGISTRATION_OPEN === "false") {
      return NextResponse.json({ error: "Registration is closed" }, { status: 403 });
    }

    if (!(await allowAttempt("signup", clientAddress(req.headers)))) {
      return NextResponse.json(
        { error: "Demasiadas cuentas creadas desde aquí. Inténtalo más tarde." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { username, password, email } = body as {
      username?: string;
      password?: string;
      email?: string;
    };

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

    // Optional, but the only way to recover an account later.
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: "Correo no válido" }, { status: 400 });
    }

    const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Username ya en uso" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, email, theme)
       VALUES ($1, $2, $3, 'dark')
       RETURNING id, username, email, theme, avatar, admin`,
      [username, hashedPassword, trimmedEmail || null],
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
