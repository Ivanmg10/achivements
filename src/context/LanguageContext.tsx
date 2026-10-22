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
import { browserLanguages, isLang, pickLanguage, type Lang } from '@/utils/languages'

export type { Lang }

const translations: Record<Lang, Translations> = { en, es, pt, fr, de, it, ru, pl, ja }

const STORAGE_KEY = 'app-language'

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  T: Translations
  /** True while the language shown is the browser's, not one the person picked. */
  fromBrowser: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // `undefined` on the server and while hydrating: English then, as the server rendered it.
  const [saved, save] = useStorageValue(STORAGE_KEY)
  const chosen = isLang(saved) ? saved : null
  // Only once hydrated, so the server and the first client render agree. Never saved:
  // what is stored is a person's choice, and the browser's can change.
  const detected = saved === undefined || chosen ? null : pickLanguage(browserLanguages())
  const lang: Lang = chosen ?? detected ?? 'en'

  // Screen readers pick their voice from <html lang>; keep it on the language actually shown.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (next: Lang) => save(next)

  return (
    <LanguageContext.Provider value={{ lang, setLang, T: translations[lang], fromBrowser: !chosen && detected !== null }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
