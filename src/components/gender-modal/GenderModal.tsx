'use client'

import CommonModal from '../common-modal/CommonModal'
import { useLanguage } from '@/context/LanguageContext'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'

export type Gender = 'male' | 'female' | 'neutral'

interface Props {
  isOpen: boolean
  onClose: () => void
  current?: Gender | null
}

export default function GenderModal({ isOpen, onClose, current }: Props) {
  const { T } = useLanguage()
  const { save, saving, error } = useSaveProfileField()

  const options: { id: Gender | ''; label: string }[] = [
    { id: 'male', label: T.userData.genderMale },
    { id: 'female', label: T.userData.genderFemale },
    { id: 'neutral', label: T.userData.genderNeutral },
    { id: '', label: T.userData.notSet },
  ]

  async function handleSelect(id: Gender | '') {
    if (await save('gender', id)) onClose()
  }

  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">{T.userData.gender}</h2>
      {error && <p role="alert" className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2 mb-3">{error}</p>}
      <div role="radiogroup" aria-label={T.userData.gender} className="grid grid-cols-2 gap-3">
        {options.map(({ id, label }) => {
          const selected = (current ?? '') === id
          return (
            <button
              key={id}
              role="radio"
              aria-checked={selected}
              disabled={saving}
              onClick={() => handleSelect(id)}
              className={`px-3 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                selected ? 'bg-accent text-bg-main' : 'bg-bg-main hover:bg-bg-card text-text-main'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </CommonModal>
  )
}
