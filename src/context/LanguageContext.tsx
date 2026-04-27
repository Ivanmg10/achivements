'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { en, Translations } from '@/translations/en'
import { es } from '@/translations/es'

export type Lang = 'en' | 'es'

const translations: Record<Lang, Translations> = { en, es }

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  T: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

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
