'use client'

import CommonModal from '../common-modal/CommonModal'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnPlatinumCompletes } from '@/hooks/usePsnPlatinumCompletes'
import { usePsnRevealHidden } from '@/hooks/usePsnRevealHidden'

type Option = { value: boolean; label: string }

function Choice({ title, current, options, onChoose }: { title: string; current: boolean; options: Option[]; onChoose: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      <div role="radiogroup" aria-label={title} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={current === o.value}
            onClick={() => onChoose(o.value)}
            className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              current === o.value ? 'bg-accent text-bg-main' : 'bg-bg-main hover:bg-bg-card text-text-main'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** PlayStation preferences: what counts as completed, and whether hidden trophies start out shown. */
export default function PsnPreferencesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [platinum, setPlatinum] = usePsnPlatinumCompletes()
  const [reveal, setReveal] = usePsnRevealHidden()

  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">{T.userData.psnSection}</h2>
      <div className="flex flex-col gap-5">
        <Choice
          title={T.userData.psnPlatinum}
          current={platinum}
          onChoose={setPlatinum}
          options={[
            { value: false, label: T.userData.psnPlatinumOff },
            { value: true, label: T.userData.psnPlatinumOn },
          ]}
        />
        <Choice
          title={T.userData.psnHiddenTrophies}
          current={reveal}
          onChoose={setReveal}
          options={[
            { value: false, label: T.userData.psnHiddenConceal },
            { value: true, label: T.userData.psnHiddenReveal },
          ]}
        />
      </div>
    </CommonModal>
  )
}
