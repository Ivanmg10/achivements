import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cronRefusal } from '@/lib/secrets'
import pool from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { daysLeft, listPsnAccounts, markPsnWarned } from '@/lib/psnAccounts'
import { psnPoolConfigured } from '@/lib/psnPool'
import { telegramConfigured } from '@/lib/telegram'
import { siteOrigin } from '@/lib/siteUrl'
import type { PsnAccountInfo } from '@/types/psnPool'

/** Start warning this many days before an NPSSO dies. */
const WARN_DAYS = 7
/** Then again at most this often, until it is renewed. */
const REPEAT_MS = 2 * 24 * 60 * 60 * 1000
const SSO_COOKIE_URL = 'https://ca.account.sony.com/api/v1/ssocookie'

/** The accounts whose sign-in dies within a week and were not mailed about in the last two days. */
function dueAccounts(accounts: PsnAccountInfo[], now = Date.now()): PsnAccountInfo[] {
  return accounts.filter((a) => {
    const left = daysLeft(a.npssoExpiresAt, now)
    const recentlyWarned = a.warnedAt !== null && now - a.warnedAt < REPEAT_MS
    return a.status !== 'paused' && left !== null && left <= WARN_DAYS && !recentlyWarned
  })
}

function message(due: PsnAccountInfo[], panel: string) {
  const lines = due.map((a) => {
    const left = daysLeft(a.npssoExpiresAt)!
    return left === 0 ? `- ${a.label}: expired.` : `- ${a.label}: expires in ${left} days.`
  })
  const subject = due.length === 1 ? `CheevoVault: the PSN sign-in of ${due[0].label} needs renewing` : `CheevoVault: ${due.length} PSN sign-ins need renewing`
  const text = [
    'These PlayStation Network sign-ins CheevoVault reads PSN with are about to stop working:',
    ...lines,
    '',
    'To renew one (about a minute), in a private window:',
    '1. Sign in at https://www.playstation.com with that account.',
    `2. Open ${SSO_COOKIE_URL} and copy the value of "npsso".`,
    `3. Paste it under Renew, in the admin panel's PlayStation tab: ${panel}`,
  ].join('\n')
  const html = text
    .split('\n')
    .map((line) => (line ? `<p>${line.replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>')}</p>` : ''))
    .join('')
  return { subject, text, html }
}

/**
 * Daily, from Vercel Cron (vercel.json): the e-mail fallback for expiring PSN sign-ins. When Telegram is set up
 * (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID), `/api/cron/psn-alerts` tells the owner there and this does nothing.
 * Otherwise it mails the admins about every service account whose NPSSO has a week or less, every two days until
 * it is renewed (renewing clears the flag). Sony offers no way to extend an NPSSO.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without the variable the route refuses everyone.
 */
export async function GET(req: NextRequest) {
  const refused = cronRefusal(req)
  if (refused) return refused
  if (telegramConfigured()) return NextResponse.json({ skipped: 'telegram' })

  try {
    if (!(await psnPoolConfigured())) return NextResponse.json({ configured: false })
    const due = dueAccounts(await listPsnAccounts())
    if (due.length === 0) return NextResponse.json({ warned: false })

    const { rows } = await pool.query('SELECT email FROM users WHERE admin = true AND email IS NOT NULL')
    const mail = message(due, siteOrigin(req.url) ?? '')
    const results = await Promise.all((rows as { email: string }[]).map((r) => sendEmail({ to: r.email, ...mail })))
    const sent = results.filter((r) => r === 'sent').length
    if (sent > 0) await markPsnWarned(due.map((a) => a.id))
    return NextResponse.json({ warned: sent > 0, sent, accounts: due.map((a) => a.label) })
  } catch (err) {
    console.error('[cron psnToken]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
