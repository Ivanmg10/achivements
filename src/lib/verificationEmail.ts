import { sendEmail, emailConfigured } from '@/lib/email'
import { signVerification, verificationUrl } from '@/lib/emailVerification'

/**
 * Mails someone the link that proves their address is theirs.
 *
 * Never throws: verification is a nicety, and an account must still be created
 * (or an address still changed) when the mail cannot go out. The caller does
 * not wait for it either.
 */
export async function sendVerificationEmail(
  userId: string | number,
  username: string,
  email: string,
): Promise<void> {
  if (!emailConfigured()) return

  try {
    const link = verificationUrl(signVerification(userId, email))
    await sendEmail({
      to: email,
      subject: 'Confirm your CheevoVault email',
      text: `Hi ${username},\n\nConfirm this address so you can get back into your account if you ever forget your password. The link lasts a week.\n\n${link}\n\nYou can keep using CheevoVault either way — nothing is locked.`,
      html: `<p>Hi ${username},</p><p>Confirm this address so you can get back into your account if you ever forget your password. The link lasts a week.</p><p><a href="${link}">${link}</a></p><p>You can keep using CheevoVault either way — nothing is locked.</p>`,
    })
  } catch (err) {
    console.error('[verificationEmail]', err)
  }
}
