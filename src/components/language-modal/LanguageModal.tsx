'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import ChoiceCards from '@/components/ui/ChoiceCards'
import Button from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { LANGUAGES, type Lang } from '@/utils/languages'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const OPTIONS = LANGUAGES.map(({ id, label }) => ({ value: id, label }))

export default function LanguageModal({ isOpen, onClose }: Props) {
  const { lang, setLang, T } = useLanguage()
  const [pick, setPick] = useState<Lang>(lang)

  // Opens on the language in use, not on what was browsed last time.
  useWhenChanged([isOpen, lang], () => setPick(lang))

  const handleSave = () => {
    setLang(pick)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={T.userConfig.language}
      footer={
        <>
          <Button variant="quiet" size="sm" onClick={onClose}>{T.editProfileModal.cancel}</Button>
          <Button size="sm" onClick={handleSave}>{T.editProfileModal.save}</Button>
        </>
      }
    >
      <ChoiceCards legend={T.userConfig.language} value={pick} onChange={setPick} options={OPTIONS} columns={3} />
    </Modal>
  )
}
