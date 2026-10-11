'use client'

import CommonModal from '../common-modal/CommonModal'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnRevealHidden } from '@/hooks/usePsnRevealHidden'

/** PlayStation preferences: whether hidden trophies start out shown or concealed. */
export default function PsnPreferencesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [reveal, setReveal] = usePsnRevealHidden()
  const options = [
    { reveal: false, label: T.userData.psnHiddenConceal },
    { reveal: true, label: T.userData.psnHiddenReveal },
  ]

  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">{T.userData.psnHiddenTrophies}</h2>
      <div role="radiogroup" aria-label={T.userData.psnHiddenTrophies} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={String(o.reveal)}
            role="radio"
            aria-checked={reveal === o.reveal}
            onClick={() => {
              setReveal(o.reveal)
              onClose()
            }}
            className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              reveal === o.reveal ? 'bg-accent text-bg-main' : 'bg-bg-main hover:bg-bg-card text-text-main'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </CommonModal>
  )
}
