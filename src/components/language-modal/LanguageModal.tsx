'use client'

import CommonModal from '../common-modal/CommonModal'
import { useLanguage, Lang } from '@/context/LanguageContext'

const LANGUAGES: { id: Lang; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'pt', label: 'Português', flag: '🇧🇷' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { id: 'it', label: 'Italiano', flag: '🇮🇹' },
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'pl', label: 'Polski', flag: '🇵🇱' },
  { id: 'ja', label: '日本語', flag: '🇯🇵' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function LanguageModal({ isOpen, onClose }: Props) {
  const { lang, setLang, T } = useLanguage()

  const handleSelect = (id: Lang) => {
    setLang(id)
    onClose()
  }

  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold">{T.userConfig.language}</h2>

      <div role="radiogroup" aria-label={T.userConfig.language} className="flex flex-col gap-3">
        {LANGUAGES.map(({ id, label, flag }) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            role="radio"
            aria-checked={lang === id}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
              lang === id
                ? 'bg-accent text-bg-main'
                : 'bg-bg-main hover:bg-bg-card text-text-main'
            }`}
          >
            <span className="text-2xl" aria-hidden="true">{flag}</span>
            <span className="text-lg font-medium">{label}</span>
            {lang === id && (
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-current opacity-80" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </CommonModal>
  )
}
