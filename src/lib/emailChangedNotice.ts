import { emailConfigured, sendEmail } from '@/lib/email'
import { CONTACT_EMAIL } from '@/lib/siteUrl'

/** j***@example.com: enough for the owner to recognise it, not enough to hand it out. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 1) return '***'
  return `${email[0]}***${email.slice(at)}`
}

/**
 * Tells the old address that the account's email changed. The address is how
 * an account is recovered, so a change nobody asked for — a stolen session,
 * or an admin acting on it — is how an account gets taken over; this mail is
 * what lets the real owner notice in time.
 *
 * Never throws: the change already happened, and the caller does not wait.
 */
export async function sendEmailChangedNotice({
  to,
  username,
  newEmail,
  byAdmin,
}: {
  to: string
  username: string
  newEmail: string
  byAdmin: boolean
}): Promise<void> {
  if (!emailConfigured()) return

  const who = byAdmin ? 'An administrator changed' : 'Someone changed'
  const masked = maskEmail(newEmail)
  const contact = CONTACT_EMAIL
    ? `If you did not ask for this, write to ${CONTACT_EMAIL} straight away.`
    : 'If you did not ask for this, reply to this message straight away.'

  try {
    await sendEmail({
      to,
      subject: 'The email on your CheevoVault account changed',
      text: `Hi ${username},\n\n${who} the email address of your CheevoVault account to ${masked}. Password recovery now goes there, not here.\n\nIf this was you, there is nothing to do. ${contact}`,
      html: `<p>Hi ${username},</p><p>${who} the email address of your CheevoVault account to <strong>${masked}</strong>. Password recovery now goes there, not here.</p><p>If this was you, there is nothing to do. ${contact}</p>`,
    })
  } catch (err) {
    console.error('[emailChangedNotice]', err)
  }
}
