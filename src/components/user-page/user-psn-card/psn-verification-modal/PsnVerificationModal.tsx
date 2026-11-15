'use client'

import { IconShieldCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnVerification } from '@/hooks/usePsnVerification'
import { notify } from '@/lib/notify'
import { psnVerifyError } from '@/utils/apiErrors'
import Button from '@/components/ui/Button'
import ErrorRetry from '@/components/ui/ErrorRetry'
import Modal from '@/components/ui/Modal'
import Notice from '@/components/ui/Notice'
import PsnVerificationCode from '@/components/user-page/user-psn-card/psn-verification-code/PsnVerificationCode'
import PsnVerificationWhy from '@/components/user-page/user-psn-card/psn-verification-why/PsnVerificationWhy'

/**
 * Proving the linked PlayStation account is yours (#176): the code to paste in its About Me and a button
 * that reads it. The code is asked for only while the dialog is open, since asking makes one. A failed
 * check stays inline (the dialog stays open); a good one is a toast and closes it.
 */
export default function PsnVerificationModal({ isOpen, onClose, onlineId }: { isOpen: boolean; onClose: () => void; onlineId: string | null }) {
  const { T } = useLanguage()
  const V = T.psn.verification
  const { code, isLoading, loadError, retry, checking, error, check } = usePsnVerification({ active: isOpen })

  const handleCheck = async () => {
    if (!(await check())) return
    notify.success(T.toast.psnVerified)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      icon={<IconShieldCheck size={20} />}
      title={V.title}
      hint={V.body}
      className="gap-3"
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>{V.later}</Button>
          <Button loading={checking} disabled={!code} onClick={handleCheck}>
            {checking ? V.checking : V.check}
          </Button>
        </>
      }
    >
      {loadError ? (
        <ErrorRetry message={psnVerifyError(loadError, T)} retryLabel={T.psn.retry} onRetry={retry} />
      ) : (
        <>
          <PsnVerificationCode code={isLoading ? null : code} />
          <p className="text-xs text-text-secondary">{V.validFor}</p>
        </>
      )}
      {onlineId && (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          href={`https://profile.playstation.com/${encodeURIComponent(onlineId)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {V.openProfile}
        </Button>
      )}
      {error && <Notice tone="danger" size="sm">{psnVerifyError(error, T)}</Notice>}
      <PsnVerificationWhy />
    </Modal>
  )
}
