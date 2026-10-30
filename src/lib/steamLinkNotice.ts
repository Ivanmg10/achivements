import { emailConfigured, escapeHtml, sendEmail } from '@/lib/email'
import { CONTACT_EMAIL } from '@/lib/siteUrl'

/**
 * Tells the account's address that Steam was linked or unlinked. Linking adds a
 * way in that a new password does not end, so a link nobody asked for is what
 * this mail lets the owner catch. Never throws: the change already happened.
 */
export async function sendSteamLinkNotice({ to, username, linked }: { to: string; username: string; linked: boolean }): Promise<void> {
  if (!emailConfigured()) return

  const line = linked
    ? 'A Steam account was linked to your CheevoVault account. It can now sign in to it.'
    : 'Steam was unlinked from your CheevoVault account. It can no longer sign in to it.'
  const help = linked
    ? `If this was not you, unlink Steam from your account page and change your password${CONTACT_EMAIL ? `, then write to ${CONTACT_EMAIL}` : ''}.`
    : `If this was not you, change your password${CONTACT_EMAIL ? ` and write to ${CONTACT_EMAIL}` : ''}.`

  try {
    await sendEmail({
      to,
      subject: linked ? 'Steam was linked to your CheevoVault account' : 'Steam was unlinked from your CheevoVault account',
      text: `Hi ${username},\n\n${line}\n\n${help}`,
      html: `<p>Hi ${escapeHtml(username)},</p><p>${line}</p><p>${escapeHtml(help)}</p>`,
    })
  } catch (err) {
    console.error('[steamLinkNotice]', err)
  }
}
