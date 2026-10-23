import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-card rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
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
      </div>
    </div>
  )
}
