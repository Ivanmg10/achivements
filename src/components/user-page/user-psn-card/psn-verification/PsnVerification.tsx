'use client'

import { usePsnVerification } from '@/hooks/usePsnVerification'
import PsnVerificationTag from '@/components/user-page/user-psn-card/psn-verification-tag/PsnVerificationTag'
import PsnVerificationButton from '@/components/user-page/user-psn-card/psn-verification-button/PsnVerificationButton'

/**
 * Whether the linked PlayStation account is proven to be yours (#176), as one line: the tag in words and,
 * while not verified, the button that opens the dialog. The welcome's PSN step uses it; the account page's
 * card puts the two pieces in its head instead. Never blocks anything: it is an offer.
 */
export default function PsnVerification({ onlineId }: { onlineId: string | null }) {
  const { linked } = usePsnVerification({ active: false })
  if (!linked) return null
  return (
    <div className="flex items-center justify-between gap-2">
      <PsnVerificationTag />
      <PsnVerificationButton onlineId={onlineId} />
    </div>
  )
}
