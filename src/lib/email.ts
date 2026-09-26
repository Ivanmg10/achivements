/**
 * Sending email through Resend, over their REST API — no SDK needed for the
 * one message this app sends.
 *
 * NOTE FOR ANYONE WORKING ON THIS: with only `RESEND_API_KEY` set, messages
 * go out from Resend's shared sender, which **only delivers to the Resend
 * account owner's own address** — enough to try the flow, no use for other
 * people. Set `EMAIL_FROM` to an address on a domain verified in Resend and
 * it reaches everyone. With no key at all, `sendEmail` reports
 * `not-configured` and the callers say so honestly rather than pretending a
 * message went out. See README.md → Email.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Resend's shared sender. Delivers only to the account owner, but needs no domain. */
const SHARED_SENDER = 'CheevoVault <onboarding@resend.dev>'

export function emailSender(): string {
  return process.env.EMAIL_FROM || SHARED_SENDER
}

export type SendResult = 'sent' | 'not-configured' | 'failed'

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
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
      body: JSON.stringify({ from: emailSender(), to: [to], subject, html, text }),
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
