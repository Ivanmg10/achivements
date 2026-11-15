'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnVerification } from '@/hooks/usePsnVerification'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'

// Downloaded the first time it opens, not with the page.
const PsnVerificationModal = dynamic(() => import('@/components/user-page/user-psn-card/psn-verification-modal/PsnVerificationModal'), { loading: () => null })

/**
 * Whether the linked PlayStation account is proven to be yours (#176), as one line on its card: a tag in
 * words and, while not verified, a button that opens the dialog with the code. Not verified, its trophies
 * still show but add no Vault Points. Never blocks anything: it is an offer.
 */
export default function PsnVerification({ onlineId }: { onlineId: string | null }) {
  const { T } = useLanguage()
  const V = T.psn.verification
  const { linked, verified } = usePsnVerification({ active: false })
  const [open, setOpen] = useState(false)

  if (!linked) return null

  return (
    <div className="flex items-center justify-between gap-2">
      <Tag tone={verified ? 'success' : 'warning'}>{verified ? V.verified : V.unverified}</Tag>
      {!verified && (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          {V.verify}
        </Button>
      )}
      <LazyWhenOpened open={open}>
        <PsnVerificationModal isOpen={open} onClose={() => setOpen(false)} onlineId={onlineId} />
      </LazyWhenOpened>
    </div>
  )
}
