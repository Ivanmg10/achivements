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
import { LANGUAGE_COOKIE, browserLanguages, isLang, languageCookie, pickLanguage, type Lang } from '@/utils/languages'

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

function writeCookie(lang: Lang) {
  try {
    document.cookie = languageCookie(lang, window.location.protocol === 'https:')
  } catch {
    // Cookies blocked: the server cannot know the choice, the browser still shows it.
  }
}

/** The choice the cookie holds, for a browser whose storage lost it (cleared, or blocked). */
function cookieChoice(): Lang | null {
  try {
    const found = document.cookie.split(/;\s*/).find((c) => c.startsWith(`${LANGUAGE_COOKIE}=`))
    const value = found?.slice(LANGUAGE_COOKIE.length + 1)
    return isLang(value) ? value : null
  } catch {
    return null
  }
}

/**
 * `initial` is what the server rendered in (`serverLanguage`, in layouts that
 * read the request): used while hydrating, so the first paint is already in
 * the person's language and matches. Without it the server and hydration
 * render English.
 */
export function LanguageProvider({ children, initial }: { children: ReactNode; initial?: Lang | null }) {
  // `undefined` on the server and while hydrating.
  const [saved, save] = useStorageValue(STORAGE_KEY)
  const chosen = isLang(saved) ? saved : saved === undefined ? null : cookieChoice()
  // Only once hydrated, so the server and the first client render agree. Never saved:
  // what is stored is a person's choice, and the browser's can change.
  const detected = saved === undefined || chosen ? null : pickLanguage(browserLanguages())
  const lang: Lang = saved === undefined ? (initial ?? 'en') : (chosen ?? detected ?? 'en')

  // Screen readers pick their voice from <html lang>; keep it on the language actually shown.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // A choice made before the cookie existed reaches the server from now on.
  useEffect(() => {
    if (chosen && cookieChoice() !== chosen) writeCookie(chosen)
  }, [chosen])

  const setLang = (next: Lang) => {
    save(next)
    writeCookie(next)
  }

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
