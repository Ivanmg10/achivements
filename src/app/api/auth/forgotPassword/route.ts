import { NextRequest, NextResponse, after } from 'next/server'
import pool from '@/lib/db'
import { allowAttempt, clientAddress } from '@/lib/attemptLimit'
import { emailConfigured, sendEmail } from '@/lib/email'
import { createResetToken, resetUrl } from '@/lib/passwordReset'

/** Looks the address up and, if it has an account, mails that account a reset link. */
async function sendResetLink(email: string) {
  try {
    const { rows } = await pool.query('SELECT id, username, email FROM users WHERE LOWER(email) = LOWER($1)', [email])
    const user = rows[0]
    if (!user) return

    const token = await createResetToken(user.id)
    const link = resetUrl(token)
    await sendEmail({
      // The stored address, never the one typed: a variant that only matches
      // case-insensitively could be someone else's mailbox.
      to: user.email,
      subject: 'Reset your CheevoVault password',
      text: `Hi ${user.username},\n\nOpen this link to set a new password. It works once and expires in an hour.\n\n${link}\n\nIf you did not ask for this, ignore this email — nothing has changed.`,
      html: `<p>Hi ${user.username},</p><p>Open this link to set a new password. It works once and expires in an hour.</p><p><a href="${link}">${link}</a></p><p>If you did not ask for this, ignore this email — nothing has changed.</p>`,
    })
  } catch (err) {
    console.error('[auth/forgotPassword]', err)
  }
}

/**
 * Starts a password reset. Whether or not that address belongs to an account,
 * the answer is the same — same body, and the same time, since the lookup and
 * the mail happen after the response goes out — so this cannot be used to
 * find out who is registered. The one exception is email not being set up at
 * all: telling the visitor to wait for a message that can never arrive would
 * be a lie.
 */
export async function POST(req: NextRequest) {
  try {
    if (!emailConfigured()) {
      return NextResponse.json({ error: 'email-not-configured' }, { status: 503 })
    }

    if (!(await allowAttempt('reset', clientAddress(req.headers)))) {
      return NextResponse.json({ error: 'too-many-requests' }, { status: 429 })
    }

    const { email } = (await req.json()) as { email?: unknown }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    after(() => sendResetLink(email.trim()))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/forgotPassword]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
