'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useEmailVerification } from '@/hooks/useEmailVerification'
import Notice from '@/components/ui/Notice'
import Button from '@/components/ui/Button'

/**
 * Tells someone their address has not been confirmed, and offers to send the
 * link again.
 *
 * Deliberately a notice and not a gate: an unconfirmed address costs nothing
 * until the day a password is forgotten, and locking people out of an
 * achievement tracker over a mail that landed in spam would cost more than it
 * ever saved.
 */
export default function EmailVerificationNotice() {
  const { T } = useLanguage()
  const { unverified, outcome, resendState, resend } = useEmailVerification()

  if (outcome === 'verified') {
    return (
      <Notice tone="success">{T.passwordReset.verifyDone}</Notice>
    )
  }

  if (!unverified) return null

  const message =
    resendState === 'sent' ? T.passwordReset.verifySent
    : resendState === 'failed' ? T.passwordReset.verifyFailed
    : outcome === 'expired' ? T.passwordReset.verifyExpired
    : T.passwordReset.verifyText

  return (
    <Notice
      tone="warning"
      alert
      title={T.passwordReset.verifyTitle}
      action={
        resendState !== 'sent' ? (
          <Button variant="quiet" size="sm" onClick={resend} loading={resendState === 'sending'}>
            {resendState === 'sending' ? T.passwordReset.verifySending : T.passwordReset.verifyResend}
          </Button>
        ) : undefined
      }
    >
      {message}
    </Notice>
  )
}
