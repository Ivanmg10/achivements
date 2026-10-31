import { NextRequest, NextResponse, after } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { allowAttempt, clientAddress } from "@/lib/attemptLimit";
import { BCRYPT_COST, PASSWORD_MIN, isEmail } from "@/utils/authValidation";
import { sendVerificationEmail } from "@/lib/verificationEmail";
import { fetchRaProfile, raAvatarUrl, validRaCredentials } from "@/lib/raProfile";
import { onPlatformLinked } from "@/lib/scoreRefresh";
import { sealRaKey } from "@/lib/raKey";

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

    const body = await req.json().catch(() => ({}));
    const { username, password, email, ra } = body as {
      username?: string;
      password?: string;
      email?: string;
      /** Sign up with RetroAchievements: its username and Web API key, linked at once. */
      ra?: { username?: unknown; apiKey?: unknown } | null;
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
    if (!isEmail(trimmedEmail)) {
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

    // With RetroAchievements: asked of RA again here (what the form showed is not taken on its word),
    // and stored as linking from the account page stores it, with RA's picture as the avatar.
    let linkedRa: { profile: Record<string, unknown>; key: string } | null = null;
    if (ra) {
      if (!validRaCredentials(ra.username, ra.apiKey)) {
        return NextResponse.json({ error: "ra-invalid" }, { status: 400 });
      }
      const fetched = await fetchRaProfile(ra.username.trim(), (ra.apiKey as string).trim());
      if (!fetched.ok) return NextResponse.json({ error: fetched.error }, { status: fetched.status });
      linkedRa = { profile: fetched.profile, key: (ra.apiKey as string).trim() };
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
    const raName = linkedRa ? String(linkedRa.profile.User) : null;
    const sealedRa = linkedRa ? sealRaKey(linkedRa.key) : null;

    const result = await pool.query(
      `INSERT INTO users (username, password, email, theme, avatar, rausername, raid, "raUser", raid_hash)
       VALUES ($1, $2, $3, 'dark', $4, $5, $6, $7, $8)
       RETURNING id, username, email, theme, avatar, admin`,
      [
        username,
        hashedPassword,
        trimmedEmail,
        raName ? raAvatarUrl(raName) : null,
        raName,
        sealedRa?.sealed ?? null,
        linkedRa ? JSON.stringify(linkedRa.profile) : null,
        sealedRa?.hash ?? null,
      ],
    );

    const created = result.rows[0];
    // After the response: a slow mail server must not hold up the sign-up, and
    // an address that cannot be reached is not a reason to refuse an account.
    after(() => sendVerificationEmail(created.id, created.username, trimmedEmail));
    if (linkedRa) await onPlatformLinked(created.id, "ra");

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    // Two sign-ups raced past the checks above; the unique index stopped the second.
    const { code, constraint } = err as { code?: string; constraint?: string };
    if (code === "23505") {
      // One key, one account: that key already links another account here.
      if (constraint === "users_raid_hash_key" || constraint === "users_raId_key") return NextResponse.json({ error: "key-in-use" }, { status: 409 });
      return constraint === "users_email_lower_key"
        ? NextResponse.json({ error: "email-taken" }, { status: 409 })
        : NextResponse.json({ error: "Username ya en uso" }, { status: 409 });
    }
    console.error("[users POST]", err);
    return NextResponse.json(
      { error: "Error creando usuario" },
      { status: 500 },
    );
  }
}
