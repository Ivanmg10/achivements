'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnVerification } from '@/hooks/usePsnVerification'
import { notify } from '@/lib/notify'
import { psnVerifyError } from '@/utils/apiErrors'
import Button from '@/components/ui/Button'
import ErrorRetry from '@/components/ui/ErrorRetry'
import Notice from '@/components/ui/Notice'
import Tag from '@/components/ui/Tag'
import PsnVerificationCode from '@/components/user-page/user-psn-card/psn-verification-code/PsnVerificationCode'

/**
 * Proving the linked PlayStation account is yours (#176): a code to paste in its About Me and a button that
 * reads it. Not verified, its trophies still show but add no Vault Points, so the panel is open until "Later"
 * folds it into a line with a button to open it again. Never blocks anything: it is an offer.
 */
export default function PsnVerification({ onlineId }: { onlineId: string | null }) {
  const { T } = useLanguage()
  const V = T.psn.verification
  const { linked, verified, code, isLoading, loadError, retry, checking, error, check } = usePsnVerification()
  const [folded, setFolded] = useState(false)

  if (!linked) return null

  if (verified) {
    return (
      <Notice tone="success" size="sm" title={V.verified}>
        {V.verifiedNote}
      </Notice>
    )
  }

  if (folded) {
    return (
      <div className="flex items-center justify-between gap-2">
        <Tag tone="warning">{V.unverified}</Tag>
        <Button variant="secondary" size="sm" onClick={() => setFolded(false)}>
          {V.verify}
        </Button>
      </div>
    )
  }

  const handleCheck = async () => {
    if (await check()) notify.success(T.toast.psnVerified)
  }

  return (
    <section aria-labelledby="psn-verification-title" className="rounded-tile bg-ink/[0.03] p-3 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 id="psn-verification-title" className="font-bold text-sm">{V.title}</h3>
        <p className="text-xs text-text-secondary">{V.body}</p>
        <p className="text-xs text-text-secondary">{V.counts}</p>
      </div>

      {loadError ? (
        <ErrorRetry message={psnVerifyError(loadError, T)} retryLabel={T.psn.retry} onRetry={retry} />
      ) : (
        <>
          <PsnVerificationCode code={isLoading ? null : code} />
          <p className="text-xs text-text-secondary">{V.validFor}</p>
        </>
      )}

      {error && <Notice tone="danger" size="sm">{psnVerifyError(error, T)}</Notice>}

      <div className="flex flex-wrap items-center gap-2">
        <Button loading={checking} disabled={!code} onClick={handleCheck}>
          {checking ? V.checking : V.check}
        </Button>
        {onlineId && (
          <Button
            variant="secondary"
            href={`https://profile.playstation.com/${encodeURIComponent(onlineId)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {V.openProfile}
          </Button>
        )}
        <Button variant="quiet" onClick={() => setFolded(true)}>
          {V.later}
        </Button>
      </div>
    </section>
  )
}
