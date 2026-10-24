'use client'

import { IconCircleCheck, IconMailExclamation } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useEmailVerification } from '@/hooks/useEmailVerification'

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
      <div role="status" className="flex items-center gap-3 bg-success/10 ring-1 ring-inset ring-success/30 rounded-control p-4">
        <IconCircleCheck size={18} className="text-success shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium text-success">{T.passwordReset.verifyDone}</p>
      </div>
    )
  }

  if (!unverified) return null

  const message =
    resendState === 'sent' ? T.passwordReset.verifySent
    : resendState === 'failed' ? T.passwordReset.verifyFailed
    : outcome === 'expired' ? T.passwordReset.verifyExpired
    : T.passwordReset.verifyText

  return (
    <div role="alert" className="flex items-start gap-3 bg-warning/10 ring-1 ring-inset ring-warning/30 rounded-control p-4">
      <IconMailExclamation size={18} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-semibold text-warning">{T.passwordReset.verifyTitle}</p>
        <p className="text-xs text-text-secondary">{message}</p>
        {resendState !== 'sent' && (
          <button
            onClick={resend}
            disabled={resendState === 'sending'}
            className="self-start mt-1 text-xs font-medium text-warning underline underline-offset-2 hover:text-warning disabled:opacity-50 disabled:no-underline transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/70"
          >
            {resendState === 'sending' ? T.passwordReset.verifySending : T.passwordReset.verifyResend}
          </button>
        )}
      </div>
    </div>
  )
}
