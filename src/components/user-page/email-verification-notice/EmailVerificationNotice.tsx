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
      <div role="status" className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
        <IconCircleCheck size={18} className="text-green-400 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium text-green-300">{T.passwordReset.verifyDone}</p>
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
    <div role="alert" className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
      <IconMailExclamation size={18} className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-semibold text-amber-300">{T.passwordReset.verifyTitle}</p>
        <p className="text-xs text-text-secondary">{message}</p>
        {resendState !== 'sent' && (
          <button
            onClick={resend}
            disabled={resendState === 'sending'}
            className="self-start mt-1 text-xs font-medium text-amber-300 underline underline-offset-2 hover:text-amber-200 disabled:opacity-50 disabled:no-underline transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          >
            {resendState === 'sending' ? T.passwordReset.verifySending : T.passwordReset.verifyResend}
          </button>
        )}
      </div>
    </div>
  )
}
