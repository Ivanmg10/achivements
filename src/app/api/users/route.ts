import { NextRequest, NextResponse, after } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { allowAttempt, clientAddress } from "@/lib/attemptLimit";
import { BCRYPT_COST, PASSWORD_MIN } from "@/utils/authValidation";
import { sendVerificationEmail } from "@/lib/verificationEmail";

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

    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
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

    if (password.length < PASSWORD_MIN) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres` },
        { status: 400 },
      );
    }

    // Required: it is the only way to recover an account later.
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: "Correo no válido" }, { status: 400 });
    }

    // Case-insensitive, so nobody can sign up as "Ivan" next to "ivan".
    const existing = await pool.query("SELECT id FROM users WHERE LOWER(username) = LOWER($1)", [username]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Username ya en uso" }, { status: 409 });
    }

    // One account per address: recovery mails the address, so two accounts on
    // it would leave the reset link going to whichever one the query found first.
    const emailTaken = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [trimmedEmail]);
    if (emailTaken.rows.length > 0) {
      return NextResponse.json({ error: "email-taken" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    const result = await pool.query(
      `INSERT INTO users (username, password, email, theme)
       VALUES ($1, $2, $3, 'dark')
       RETURNING id, username, email, theme, avatar, admin`,
      [username, hashedPassword, trimmedEmail],
    );

    const created = result.rows[0];
    // After the response: a slow mail server must not hold up the sign-up, and
    // an address that cannot be reached is not a reason to refuse an account.
    after(() => sendVerificationEmail(created.id, created.username, trimmedEmail));

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[users POST]", err);
    return NextResponse.json(
      { error: "Error creando usuario" },
      { status: 500 },
    );
  }
}
