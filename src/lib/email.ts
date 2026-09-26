/**
 * Sending email through Resend, over their REST API — no SDK needed for the
 * one message this app sends.
 *
 * NOTE FOR ANYONE WORKING ON THIS: the flow is finished but inert until a
 * domain is verified in Resend. Without `RESEND_API_KEY` and `EMAIL_FROM`,
 * `sendEmail` reports `not-configured` and the callers say so honestly rather
 * than pretending a message went out. Resend's shared sender
 * (onboarding@resend.dev) only delivers to the account owner's own address,
 * so it is no use for other people's accounts. See README.md → Email.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export type SendResult = 'sent' | 'not-configured' | 'failed'

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendResult> {
  if (!emailConfigured()) return 'not-configured'

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html, text }),
    })

    if (!res.ok) {
      // The body carries Resend's reason — an unverified domain shows up here.
      console.error('[email] Resend refused the message', res.status, await res.text().catch(() => ''))
      return 'failed'
    }
    return 'sent'
  } catch (err) {
    console.error('[email] could not reach Resend', err)
    return 'failed'
  }
}
