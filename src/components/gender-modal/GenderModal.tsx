'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import ChoiceCards from '@/components/ui/ChoiceCards'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'
import { useLanguage } from '@/context/LanguageContext'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'
import { useWhenChanged } from '@/hooks/useWhenChanged'

export type Gender = 'male' | 'female' | 'neutral'

interface Props {
  isOpen: boolean
  onClose: () => void
  current?: Gender | null
}

export default function GenderModal({ isOpen, onClose, current }: Props) {
  const { T } = useLanguage()
  const { save, saving, error, clearError } = useSaveProfileField()
  const [pick, setPick] = useState<Gender | ''>(current ?? '')

  // Opens on what is saved, not on an earlier pick that was never saved.
  useWhenChanged([isOpen, current], () => {
    setPick(current ?? '')
    clearError()
  })

  const options: { value: Gender | ''; label: string }[] = [
    { value: 'male', label: T.userData.genderMale },
    { value: 'female', label: T.userData.genderFemale },
    { value: 'neutral', label: T.userData.genderNeutral },
    { value: '', label: T.userData.notSet },
  ]

  async function handleSave() {
    if (await save('gender', pick)) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={T.userData.gender}
      footer={
        <>
          <Button variant="quiet" size="sm" onClick={onClose}>{T.editProfileModal.cancel}</Button>
          <Button size="sm" onClick={handleSave} loading={saving}>{T.editProfileModal.save}</Button>
        </>
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}
      <ChoiceCards legend={T.userData.gender} value={pick} onChange={setPick} options={options} />
    </Modal>
  )
}
