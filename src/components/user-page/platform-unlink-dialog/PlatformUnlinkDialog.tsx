'use client'

import { IconPlugConnectedX } from '@tabler/icons-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Asks before a platform is disconnected: the only red of it on the account page, since
 * the button on the card is a small quiet one (#132). It stays up while the unlink
 * runs, and the card closes it when it has an answer.
 */
export default function PlatformUnlinkDialog({
  isOpen,
  onClose,
  onConfirm,
  name,
  busy,
  busyLabel,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  /** The platform's name, in the question. */
  name: string
  busy: boolean
  /** The platform's own "Disconnecting…", when it has one. */
  busyLabel?: string
}) {
  const { T } = useLanguage()

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      size="md"
      tone="danger"
      icon={<IconPlugConnectedX size={20} />}
      title={T.userData.disconnectTitle.replace('{name}', name)}
      hint={T.userData.disconnectText}
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={busy}>
            {T.editProfileModal.cancel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>
            {busy && busyLabel ? busyLabel : T.userData.disconnect}
          </Button>
        </>
      }
    />
  )
}
