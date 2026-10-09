import crypto from 'crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { daysLeft, loadPsnCredentials, markPsnWarned, npssoExpiry, savePsnNpsso } from '@/lib/psnCredentials'
import { siteOrigin } from '@/lib/steamOpenId'

/** Start warning this many days before the NPSSO dies. */
const WARN_DAYS = 7
/** Then again at most this often, until it is renewed. */
const REPEAT_MS = 2 * 24 * 60 * 60 * 1000
const SSO_COOKIE_URL = 'https://ca.account.sony.com/api/v1/ssocookie'

/**
 * Daily, from Vercel Cron (vercel.json): mails the admins when the app's PSN
 * NPSSO has a week or less to live, so it is renewed before PSN stops. Sony
 * offers no way to extend it (see psnCredentials); this replaces having to
 * remember. Repeats every two days until someone pastes a new one, which
 * clears the flag.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without the variable the
 * route refuses everyone rather than running open.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'cron-not-configured' }, { status: 503 })

  const given = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let stored = await loadPsnCredentials()
    // Still only in the environment: store it, with the expiry Sony gives, so it can be watched.
    const envNpsso = process.env.PSN_NPSSO?.trim()
    if (!stored?.npsso && envNpsso) {
      await savePsnNpsso(envNpsso, await npssoExpiry(envNpsso), 'PSN_NPSSO')
      stored = await loadPsnCredentials()
    }
    if (!stored?.npsso) return NextResponse.json({ configured: false })

    const left = daysLeft(stored.npssoExpiresAt)
    const due = left !== null && left <= WARN_DAYS
    const recentlyWarned = stored.warnedAt !== null && Date.now() - stored.warnedAt < REPEAT_MS
    if (!due || recentlyWarned) return NextResponse.json({ daysLeft: left, warned: false })

    const { rows } = await pool.query('SELECT email FROM users WHERE admin = true AND email IS NOT NULL')
    const admins = rows as { email: string }[]
    const panel = siteOrigin(req.url) ?? ''
    const subject = left === 0 ? 'CheevoVault: the PSN sign-in has expired' : `CheevoVault: the PSN sign-in expires in ${left} days`
    const text = [
      left === 0
        ? 'The PlayStation Network sign-in CheevoVault uses has expired: PSN pages show an error until it is renewed.'
        : `The PlayStation Network sign-in CheevoVault uses expires in ${left} days. After that, PSN pages show an error until it is renewed.`,
      '',
      'To renew it (about a minute):',
      '1. Sign in at https://www.playstation.com with the account the app uses.',
      `2. Open ${SSO_COOKIE_URL} and copy the value of "npsso".`,
      `3. Paste it in the admin panel, under PlayStation sign-in: ${panel}`,
    ].join('\n')
    const html = text
      .split('\n')
      .map((line) => (line ? `<p>${line.replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>')}</p>` : ''))
      .join('')

    const results = await Promise.all(admins.map((r) => sendEmail({ to: r.email, subject, html, text })))
    const sent = results.filter((r) => r === 'sent').length
    if (sent > 0) await markPsnWarned()
    return NextResponse.json({ daysLeft: left, warned: sent > 0, sent })
  } catch (err) {
    console.error('[cron psnToken]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
