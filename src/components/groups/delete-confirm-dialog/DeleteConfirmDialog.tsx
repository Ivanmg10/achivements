import { useLanguage } from '@/context/LanguageContext'

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
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
        <p className="text-sm text-text-main">{T.groups.confirmDelete}</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-bg-main text-text-secondary text-sm hover:text-text-main transition-colors"
          >
            {T.groups.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            {T.groups.deleteGroup}
          </button>
        </div>
      </div>
    </div>
  )
}
