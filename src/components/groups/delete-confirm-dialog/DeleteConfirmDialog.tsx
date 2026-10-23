import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'
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
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false} className="gap-4">
        <p className="text-sm text-text-main">{message ?? T.groups.confirmDelete}</p>
        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="secondary" className="flex-1"
          >
            {T.groups.cancel}
          </Button>
          <Button
            onClick={onConfirm}
            variant="danger" className="flex-1"
          >
            {confirmLabel ?? T.groups.deleteGroup}
          </Button>
        </div>
      </Modal>
  )
}
