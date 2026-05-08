'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

function getSavedLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
  return saved && saved in translations ? saved : 'en'
}

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  T: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    setLangState(getSavedLang())
  }, [])

  const setLang = (next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLangState(next)
  }

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
