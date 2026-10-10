'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useStorageValue } from '@/hooks/useStorageValue'
import { en, Translations } from '@/translations/en'
import { es } from '@/translations/es'
import { pt } from '@/translations/pt'
import { fr } from '@/translations/fr'
import { de } from '@/translations/de'
import { it } from '@/translations/it'
import { ru } from '@/translations/ru'
import { pl } from '@/translations/pl'
import { ja } from '@/translations/ja'

export type Lang = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'pl' | 'ja'

const translations: Record<Lang, Translations> = { en, es, pt, fr, de, it, ru, pl, ja }

const STORAGE_KEY = 'app-language'

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  T: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // English until the saved choice is read, so server and client render the same.
  const [saved, save] = useStorageValue(STORAGE_KEY)
  const lang: Lang = saved && Object.hasOwn(translations, saved) ? (saved as Lang) : 'en'

  // Screen readers pick their voice from <html lang>; keep it on the language actually shown.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (next: Lang) => save(next)

  return (
    <LanguageContext.Provider value={{ lang, setLang, T: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
