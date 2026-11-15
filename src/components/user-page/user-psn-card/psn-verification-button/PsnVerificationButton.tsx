'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { IconShieldCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnVerification } from '@/hooks/usePsnVerification'
import Button from '@/components/ui/Button'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'

// Downloaded the first time it opens, not with the page.
const PsnVerificationModal = dynamic(() => import('@/components/user-page/user-psn-card/psn-verification-modal/PsnVerificationModal'), { loading: () => null })

/** "Verify account" while the linked PlayStation account is not verified (#176): it opens the dialog with the code. */
export default function PsnVerificationButton({ onlineId }: { onlineId: string | null }) {
  const { T } = useLanguage()
  const { linked, verified } = usePsnVerification({ active: false })
  const [open, setOpen] = useState(false)

  if (!linked || verified) return null

  return (
    <>
      <Button variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <IconShieldCheck size={16} aria-hidden="true" />
        {T.psn.verification.verify}
      </Button>
      <LazyWhenOpened open={open}>
        <PsnVerificationModal isOpen={open} onClose={() => setOpen(false)} onlineId={onlineId} />
      </LazyWhenOpened>
    </>
  )
}
