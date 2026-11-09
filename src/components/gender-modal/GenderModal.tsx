'use client'

import Modal from '@/components/ui/Modal'
import { useLanguage } from '@/context/LanguageContext'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'
import { choiceClass } from '@/components/ui/ChoiceCards'
import Notice from '@/components/ui/Notice'

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
    <Modal isOpen={isOpen} onClose={onClose} title={T.userData.gender}>
      {error && <Notice tone="danger">{error}</Notice>}
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
              className={choiceClass(selected, 'justify-center text-sm font-medium text-text-main')}
            >
              {label}
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
