import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'
import { IconTrash } from '@tabler/icons-react'
import Modal from '@/components/ui/Modal'

/** Asks before deleting something. Defaults to the wording for a group. */
export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmLabel,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message?: string
  confirmLabel?: string
}) {
  const { T } = useLanguage()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      tone="danger"
      icon={<IconTrash size={20} />}
      title={message ?? T.groups.confirmDelete}
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            {T.groups.cancel}
          </Button>
          <Button onClick={onConfirm} variant="danger">
            {confirmLabel ?? T.groups.deleteGroup}
          </Button>
        </>
      }
    />
  )
}
